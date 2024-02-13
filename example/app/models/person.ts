import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'

import Organization from './organization.js'

enum Gender {
  Male = 'M',
  Female = 'F'
}
export default class Person extends BaseModel {
  public static table = 'persons'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ columnName: 'first_name' })
  declare firstName: string

  @column({ columnName: 'last_name' })
  declare lastName: string

  @column({ columnName: 'phone' })
  declare phone: string

  @column.date({ columnName: 'date_of_birth' })
  declare dateOfBirth: DateTime | null

  @column({ columnName: 'isActive' })
  public isActive: boolean = true

  @column({ columnName: 'organization_id' })
  declare organizationId: number;

  @belongsTo(() => Organization, { foreignKey: 'organization_id' })
  declare organization: BelongsTo<typeof Organization>
}
