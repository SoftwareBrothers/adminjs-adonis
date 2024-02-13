import { BaseRecord, BaseResource, Filter, flat } from 'adminjs'
import { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'

import LucidResource from './lucid_resource.js'
import Property from './property.js'

class Resource extends BaseResource {
  protected propertiesMap: Map<string, Property> = new Map()
  protected model: LucidModel

  constructor(protected lucidResource: LucidResource) {
    super(lucidResource)

    this.model = lucidResource.model

    const metadata = this.lucidResource.getMetadata()
    const columns = [...metadata.columns.entries()]

    columns.forEach(([name, columnOptions], idx) => {
      if (columnOptions) {
        const property = new Property(columnOptions, name, idx)
        this.propertiesMap.set(name, property)
      }
    })
  }

  static isAdapterFor(lucidResource: any) {
    return (
      typeof lucidResource?.getMetadata === 'function' &&
      !!lucidResource.getMetadata().columns &&
      !!lucidResource.getMetadata().relations
    )
  }

  id() {
    return this.model.table
  }

  name() {
    return this.model.name
  }

  databaseType() {
    return this.model.query().client.dialect.name
  }

  databaseName() {
    return 'lucid'
  }

  properties() {
    return [...this.propertiesMap.values()]
  }

  property(path: string) {
    return this.propertiesMap.get(path) ?? null
  }

  async findOne(id: string): Promise<BaseRecord | null> {
    const query = this.model.query().where(this.model.primaryKey, id)

    const rawRecord = await query.first()

    if (!rawRecord) {
      return null
    }

    return new BaseRecord(rawRecord.toJSON(), this)
  }

  async find(
    filter: Filter,
    options: {
      limit?: number | undefined
      offset?: number | undefined
      sort?:
        | {
            sortBy?: string | undefined
            direction?: 'asc' | 'desc' | undefined
          }
        | undefined
    }
  ): Promise<BaseRecord[]> {
    const query = this.applyFilters(this.model.query(), filter)

    if (options.limit !== undefined) {
      query.limit(options.limit)
    }

    if (options.offset !== undefined) {
      query.offset(options.offset)
    }

    if (options.sort?.sortBy !== undefined && options.sort?.direction !== undefined) {
      query.orderBy(options.sort.sortBy, options.sort.direction)
    }

    const rawRecords = await query

    return rawRecords.map((r) => new BaseRecord(r.toJSON(), this))
  }

  async findMany(ids: string[]): Promise<BaseRecord[]> {
    const query = this.model.query().whereIn(this.model.primaryKey, ids)

    const rawRecords = await query

    return rawRecords.map((r) => new BaseRecord(r.toJSON(), this))
  }

  async count(filter: Filter) {
    const query = this.applyFilters(this.model.query(), filter)

    const result = await query.count('*', 'count').first()

    if (!result) {
      return 0
    }

    return +result.$extras.count
  }

  async create(params: Record<string, any>) {
    const unflattenedParams = flat.unflatten(params)
    const object = new this.model().fill(unflattenedParams)

    await object.save()

    return object.toJSON()
  }

  async delete(id: string) {
    const object = await this.model.find(id)

    if (object) {
      await object.delete()
    }
  }

  async update(id: string, params: Record<string, any> = {}) {
    const unflattenedParams = flat.unflatten(params)
    const object = await this.model.find(id)

    if (!object) return {}

    object.merge(unflattenedParams)
    await object.save()

    return object.toJSON()
  }

  protected applyFilters(query: ModelQueryBuilderContract<LucidModel>, filter: Filter) {
    Object.keys(filter.filters).forEach((key) => {
      const filterElement = filter.filters[key]
      const property = filterElement.property

      if (property.type() === 'uuid' || property.isId() || property.type() === 'boolean') {
        query.where(key, filterElement.value as string)
      } else if (property.type() === 'string') {
        const dialect = this.databaseType()

        if (dialect === 'postgres') {
          query.whereILike(key, `%${filterElement.value}%`)
        } else {
          query.whereLike(key, `%${filterElement.value}%`)
        }
      } else if (property.type() === 'date' || property.type() === 'datetime') {
        if ((filterElement.value as { from: string }).from) {
          query.where(key, '>=', (filterElement.value as { from: string }).from)
        }
        if ((filterElement.value as { to: string }).to) {
          query.where(key, '<=', (filterElement.value as { to: string }).to)
        }
      } else {
        query.where(key, filterElement.value as string)
      }
    })

    return query
  }
}

export default Resource
