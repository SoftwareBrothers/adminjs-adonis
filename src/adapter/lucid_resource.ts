import { LucidModel } from '@adonisjs/lucid/types/model'
import { SchemaInspector } from 'knex-schema-inspector/dist/types/schema-inspector.js'

import { LucidColumnMetadata, LucidResourceMetadata } from '../types.js'

export default class LucidResource {
  protected metadata: LucidResourceMetadata = {
    columns: new Map(),
    relations: new Map(),
  }

  constructor(
    public model: LucidModel,
    public connectionName: string
  ) {}

  async assignMetadata(inspector: SchemaInspector) {
    const columns = await inspector.columnInfo(this.model.table)

    const columnsMap = new Map<string, LucidColumnMetadata>()
    columns.forEach((column) => {
      const lucidColumnDefinitions = [...this.model.$columnsDefinitions.entries()]
      const lucidColumn = lucidColumnDefinitions.find(
        ([_key, info]) => info.columnName === column.name
      )
      const lucidRelation = [...this.model.$relationsDefinitions.values()].find(
        (relation) => (relation as any).options?.foreignKey === column.name
      )

      if (lucidColumn) {
        columnsMap.set(lucidColumn[0], {
          lucidColumn: lucidColumn[1],
          lucidRelation,
          databaseColumn: column,
        })
      }
    })

    this.metadata = {
      columns: columnsMap,
      relations: this.model.$relationsDefinitions,
    }
  }

  getMetadata() {
    return this.metadata
  }
}
