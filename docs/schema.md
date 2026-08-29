# metadata.json schema

## Block

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Dataverse `#metadataBlock name`. Identifies the block. No spaces or punctuation except underscore, and by convention starts with a letter and uses lower camel case. |
| `name` | string | yes | Dataverse `#metadataBlock displayName`. Brief label displayed for the block. |
| `description` | string | no | Summary of what the block covers, for display only. Not a Dataverse property. |
| `fields` | object[] | yes | The `#datasetField` entries belonging to this block. |

## Field

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | Dataverse `#datasetField name`. Identifies the field and maps directly to the field name used by Solr. Alphanumeric or underscore characters only, and must not start with a digit. |
| `name` | string | yes | Dataverse `#datasetField title`. Brief label displayed for the field. |
| `parent` | string | no | Display name of the compound field this field is a child of, i.e. the Dataverse `#datasetField` whose `childFields` contain it. Absent for top-level fields. |
| `definition` | string | yes | Dataverse `#datasetField description`. Free-text explanation of the field. |
| `bestPracticeDefinition` | string | no | Definition from the Dataverse North Metadata Best Practices Guide. Not a Dataverse property. |
| `recommendation` | string | no | Guidance on when to fill the field in, e.g. `Required`, `Recommended`, `Optional`. Not a Dataverse property. |
| `type` | string | yes | Dataverse `#datasetField fieldType`. One of `none`, `date`, `email`, `text`, `textbox`, `string`, `url`, `int`, `float`. |
| `required` | boolean | yes | Dataverse `#datasetField required`. Whether a value must be supplied. |
| `repeatable` | boolean | yes | Dataverse `#datasetField allowmultiples`. Whether the field may be entered more than once. |
| `example` | string | no | Sample value, for display only. Not a Dataverse property. |
| `values` | string[] | no | Controlled vocabulary entries, i.e. the `#controlledVocabulary` values allowed when Dataverse `allowControlledVocabulary` is TRUE. |
