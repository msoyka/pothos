import { TypeParam, CompatibleTypes, InputFields, FieldNullability } from '../types';
import BaseFieldUtil from './base';
import Field from '../graphql/field';

export default class FieldModifier<
  Types extends GiraphQLSchemaTypes.TypeInfo,
  ParentType extends TypeParam<Types>,
  Type extends TypeParam<Types>,
  Nullable extends FieldNullability<Types, Type>,
  Args extends InputFields<Types>,
  Extends extends string
> extends BaseFieldUtil<Types, ParentType, 'Object'> {
  field: Field<Args, Types, ParentType, Type, Nullable, string | null, any>;

  extendsField: Extends;

  constructor(
    field: Field<Args, Types, ParentType, Type, Nullable, string | null, any>,
    extendsField: Extends,
    name: string,
  ) {
    super(name);
    this.field = field;
    this.extendsField = extendsField;
  }

  expose<Name extends CompatibleTypes<Types, ParentType, Type, Nullable>>(
    name: Name,
    options?: Omit<
      GiraphQLSchemaTypes.ObjectFieldOptions<Types, ParentType, Type, Nullable, {}>,
      'resolve' | 'type' | 'args'
    >,
  ): Field<{}, Types, ParentType, Type, Nullable, Extends> {
    return this.exposeField(name, { ...options, type: this.field.type }, this.extendsField);
  }

  implement(
    options: Omit<
      GiraphQLSchemaTypes.ObjectFieldOptions<Types, ParentType, Type, Nullable, Args>,
      'type' | 'args'
    >,
  ): Field<Args, Types, ParentType, Type, Nullable, Extends> {
    return this.createField(
      { ...options, type: this.field.type, args: this.field.args },
      this.extendsField,
    );
  }
}