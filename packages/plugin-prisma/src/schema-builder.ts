import './global-types';
import { GraphQLResolveInfo } from 'graphql';
import SchemaBuilder, {
  brandWithType,
  FieldNullability,
  FieldRef,
  InterfaceRef,
  OutputType,
  SchemaTypes,
  TypeParam,
} from '@giraphql/core';
import { PrismaObjectFieldBuilder } from './field-builder';
import { getDelegateFromModel, getRefFromModel, setFindUniqueForRef } from './refs';
import { ModelName, PrismaNodeOptions } from './types';
import { queryFromInfo } from './util';

const schemaBuilderProto =
  SchemaBuilder.prototype as GiraphQLSchemaTypes.SchemaBuilder<SchemaTypes>;

schemaBuilderProto.prismaObject = function prismaObject(type, { fields, findUnique, ...options }) {
  const ref = getRefFromModel(type, this);
  const name = options.name ?? type;

  ref.name = name;

  setFindUniqueForRef(ref, this, findUnique);

  this.objectType(ref, {
    ...(options as {} as GiraphQLSchemaTypes.ObjectFieldOptions<
      SchemaTypes,
      unknown,
      TypeParam<SchemaTypes>,
      FieldNullability<SchemaTypes>,
      {},
      unknown
    >),
    name,
    fields: fields ? () => fields(new PrismaObjectFieldBuilder(name, this, type)) : undefined,
  });

  return ref as never;
};

schemaBuilderProto.prismaNode = function prismaNode(
  this: GiraphQLSchemaTypes.SchemaBuilder<SchemaTypes> & {
    nodeInterfaceRef?: () => InterfaceRef<unknown>;
  },
  model: ModelName<SchemaTypes>,
  { findUnique, name, ...options }: PrismaNodeOptions<SchemaTypes, ModelName<SchemaTypes>, []>,
) {
  const interfaceRef = this.nodeInterfaceRef?.();

  if (!interfaceRef) {
    throw new TypeError('builder.prismaNode requires @giraphql/plugin-relay to be installed');
  }

  const typeName = name ?? model;
  const delegate = getDelegateFromModel(this.options.prisma.client, model);
  const extendedOptions = {
    ...options,
    interfaces: [interfaceRef, ...(options.interfaces ?? [])],
    findUnique: (parent: unknown, context: {}) =>
      findUnique(options.id.resolve(parent as never, context) as string, context),
    loadWithoutCache: async (
      id: string,
      context: SchemaTypes['Context'],
      info: GraphQLResolveInfo,
    ) => {
      const query = queryFromInfo(context, info, typeName);
      const record = await delegate.findUnique({
        ...query,
        rejectOnNotFound: true,
        where: findUnique(id, context) as {},
      } as never);

      brandWithType(record, typeName as OutputType<SchemaTypes>);

      return record;
    },
  };

  const ref = this.prismaObject(model, extendedOptions as never);

  this.configStore.onTypeConfig(ref, (nodeConfig) => {
    this.objectField(ref, 'id', (t) =>
      (
        t as unknown as {
          globalID: (options: Record<string, unknown>) => FieldRef<unknown>;
        }
      ).globalID({
        ...options.id,
        nullable: false,
        args: {},
        resolve: async (
          parent: never,
          args: object,
          context: object,
          info: GraphQLResolveInfo,
        ) => ({
          type: nodeConfig.name,
          id: await options.id.resolve(parent, context),
        }),
      }),
    );
  });

  return ref;
} as never;