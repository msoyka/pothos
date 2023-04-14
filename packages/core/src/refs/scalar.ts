import {
  InputRef,
  inputShapeKey,
  OutputRef,
  outputShapeKey,
  parentShapeKey,
  PothosScalarTypeConfig,
  SchemaTypes,
} from '../types';
import BaseTypeRef from './base';

export default class ScalarRef<Types extends SchemaTypes, T, U, P = T>
  extends BaseTypeRef<Types, PothosScalarTypeConfig>
  implements OutputRef, InputRef, PothosSchemaTypes.ScalarRef<Types, T, U, P>
{
  override kind = 'Scalar' as const;

  [outputShapeKey]!: T;
  [parentShapeKey]!: P;

  [inputShapeKey]!: U;

  constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, name: string) {
    super(builder, 'Scalar', name);
  }
}
