import { PropertyType } from 'adminjs'

export type TypeConverter = (columnType: string) => PropertyType

export const databaseTypeToAdminType: TypeConverter = (columnType: string) => {
  switch (columnType.toLowerCase()) {
    case 'char':
    case 'character varying':
    case 'varchar':
    case 'binary':
    case 'varbinary':
    case 'tinyblob':
    case 'blob':
    case 'mediumblob':
    case 'longblob':
    case 'enum':
    case 'set':
    case 'time':
    case 'year':
      return 'string'

    case 'tinytext':
    case 'text':
    case 'mediumtext':
    case 'longtext':
      return 'textarea'

    case 'bit':
    case 'smallint':
    case 'mediumint':
    case 'int':
    case 'integer':
    case 'bigint':
      return 'number'

    case 'float':
    case 'double':
    case 'decimal':
    case 'dec':
      return 'float'

    case 'tinyint':
      return 'number'

    case 'bool':
    case 'boolean':
    case 'tinyint(1)':
      return 'boolean'

    case 'date':
      return 'date'

    case 'datetime':
    case 'timestamp':
      return 'datetime'
    case 'uuid':
      return 'uuid'
    default:
      // eslint-disable-next-line no-console
      console.warn(`Unexpected type: ${columnType} fallback to string`)
      return 'string'
  }
}
