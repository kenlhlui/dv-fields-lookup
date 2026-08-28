# metadata.json schema

## Block

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes |  |
| `name` | string | yes |  |
| `description` | string | no |  |
| `fields` | object[] | yes |  |

## Field

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes |  |
| `name` | string | yes |  |
| `definition` | string | yes |  |
| `bestPracticeDefinition` | string | no |  |
| `recommendation` | string | no |  |
| `type` | string | yes |  |
| `required` | boolean | yes |  |
| `repeatable` | boolean | yes |  |
| `example` | string | no |  |
| `values` | string[] | no |  |
