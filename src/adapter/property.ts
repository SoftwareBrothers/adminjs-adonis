import { BaseProperty, PropertyType } from 'adminjs'

import { LucidColumnMetadata } from '../types.js'
import { TypeConverter, databaseTypeToAdminType } from './type_converter.js'

export default class Property extends BaseProperty {
  protected typeConverter: TypeConverter

  constructor(
    protected columnOptions: LucidColumnMetadata,
    protected defaultPath: string,
    protected defaultPosition: number
  ) {
    super({
      path: defaultPath,
      position: defaultPosition,
    })
    this.typeConverter = databaseTypeToAdminType
  }

  setTypeConverter(customTypeConverter: (dataType: string) => PropertyType) {
    this.typeConverter = customTypeConverter
  }

  isId(): boolean {
    return this.columnOptions.lucidColumn.isPrimary
  }

  isEditable(): boolean {
    // Figure out a better way of detecting automatically generated timestamps
    return (
      !this.isId() &&
      this.columnOptions.lucidColumn.columnName !== 'createdAt' &&
      this.columnOptions.lucidColumn.columnName !== 'updatedAt'
    )
  }

  name(): string {
    return this.defaultPath
  }

  isRequired(): boolean {
    return !this.columnOptions.databaseColumn.is_nullable
  }

  isSortable(): boolean {
    return this.type() !== 'reference'
  }

  reference(): string | null {
    const isRef = this.columnOptions.lucidRelation?.relationName

    if (isRef) {
      return this.columnOptions.lucidRelation?.relatedModel()?.table ?? null
    }

    return null
  }

  availableValues(): Array<string> | null {
    return null
  }

  position(): number {
    return this.defaultPosition
  }

  type(): PropertyType {
    if (this.reference()) {
      return 'reference'
    }

    const type = this.typeConverter(this.columnOptions.databaseColumn.data_type)
    // eslint-disable-next-line no-console
    if (!type) {
      console.warn(`Unhandled type: ${this.columnOptions.databaseColumn.data_type}`)
    }

    return type
  }
}
