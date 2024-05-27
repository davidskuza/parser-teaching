export type AST = {
	type: NodeType;
	offset: number;
};

export type Node =
	| PrismaSchema
	| IdentLiteral
	| StringLiteral
	| NumberLiteral
	| BooleanLiteral
	| ArrayLiteral
	| FunctionCall
	| PropertyDefinition
	| GeneratorBlock
	| EnumBlock
	| DataSourceBlock
	| ModelBlock
	| FieldDefinition
	| PositionalParam
	| NamedParam
	| Annotation;

export type PrismaSchema = {
	type: NodeType.PrismaSchema;
	statements: Statement[];
} & AST;

export type Statement = GeneratorBlock | DataSourceBlock | EnumBlock | ModelBlock;

export type IdentLiteral = {
	type: NodeType.IdentLiteral;
	text: string;
} & AST;

export type StringLiteral = {
	type: NodeType.StringLiteral;
	value: string;
} & AST;

export type NumberLiteral = {
	type: NodeType.NumberLiteral;
	value: number;
} & AST;

export type BooleanLiteral = {
	type: NodeType.BooleanLiteral;
	value: boolean;
} & AST;

export type ArrayLiteral = {
	type: NodeType.ArrayLiteral;
	elements: Expression[];
} & AST;

export type Expression =
	| FunctionCall
	| StringLiteral
	| NumberLiteral
	| BooleanLiteral
	| ArrayLiteral
	| IdentLiteral;

export type FunctionCall = {
	type: NodeType.FunctionCall;
	name: string;
	params: (PositionalParam | NamedParam)[];
} & AST;

export type PropertyDefinition = {
	type: NodeType.PropertyDefinition;
	name: string;
	value: Expression;
} & AST;

export type GeneratorBlock = {
	type: NodeType.GeneratorBlock;
	name: string;
	properties: PropertyDefinition[];
} & AST;

export type EnumBlock = {
	type: NodeType.EnumBlock;
	name: string;
	values: IdentLiteral[];
} & AST;

export type DataSourceBlock = {
	type: NodeType.DataSourceBlock;
	name: string;
	properties: PropertyDefinition[];
} & AST;

export type ModelBlock = {
	type: NodeType.ModelBlock;
	name: string;
	fields: FieldDefinition[];
	annotations: Annotation[];
} & AST;

export type FieldDefinition = {
	type: NodeType.FieldDefinition;
	name: string;
	fieldType: string;
	isNullable: boolean;
	isArray: boolean;
	annotations: Annotation[];
} & AST;

export type PositionalParam = {
	type: NodeType.PositionalParam;
	expression: Expression;
};

export type NamedParam = {
	type: NodeType.NamedParam;
	name: string;
	expression: Expression;
} & AST;

export type Annotation = {
	type: NodeType.Annotation;
	name: string;
	params: (PositionalParam | NamedParam)[];
} & AST;

export enum NodeType {
	PrismaSchema,
	StringLiteral,
	NumberLiteral,
	BooleanLiteral,
	GeneratorBlock,
	DataSourceBlock,
	PropertyDefinition,
	EnumBlock,
	ModelBlock,
	FunctionCall,
	ArrayLiteral,
	IdentLiteral,
	FieldDefinition,
	Annotation,
	PositionalParam,
	NamedParam,
}
