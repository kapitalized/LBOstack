import * as migration_20260311_090402_init from './20260311_090402_init';
import * as migration_20260311_090655_add_users_role from './20260311_090655_add_users_role';
import * as migration_20260315_add_pages_meta_keywords from './20260315_add_pages_meta_keywords';
import * as migration_20260317_add_api_sources_and_runs from './20260317_add_api_sources_and_runs';
import * as migration_20260323_add_finance_reference_tables from './20260323_add_finance_reference_tables';
import * as migration_20260323_add_lbo_output_tables_and_drop_construction_refs from './20260323_add_lbo_output_tables_and_drop_construction_refs';
import * as migration_20260323_rename_model_type_values from './20260323_rename_model_type_values';

export const migrations = [
  {
    up: migration_20260311_090402_init.up,
    down: migration_20260311_090402_init.down,
    name: '20260311_090402_init',
  },
  {
    up: migration_20260311_090655_add_users_role.up,
    down: migration_20260311_090655_add_users_role.down,
    name: '20260311_090655_add_users_role',
  },
  {
    up: migration_20260315_add_pages_meta_keywords.up,
    down: migration_20260315_add_pages_meta_keywords.down,
    name: '20260315_add_pages_meta_keywords',
  },
  {
    up: migration_20260317_add_api_sources_and_runs.up,
    down: migration_20260317_add_api_sources_and_runs.down,
    name: '20260317_add_api_sources_and_runs',
  },
  {
    up: migration_20260323_add_finance_reference_tables.up,
    down: migration_20260323_add_finance_reference_tables.down,
    name: '20260323_add_finance_reference_tables',
  },
  {
    up: migration_20260323_add_lbo_output_tables_and_drop_construction_refs.up,
    down: migration_20260323_add_lbo_output_tables_and_drop_construction_refs.down,
    name: '20260323_add_lbo_output_tables_and_drop_construction_refs',
  },
  {
    up: migration_20260323_rename_model_type_values.up,
    down: migration_20260323_rename_model_type_values.down,
    name: '20260323_rename_model_type_values',
  },
];
