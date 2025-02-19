docker exec -it docker-db-1 /bin/bash

很好，默认是没有密码的

psql

![[Pasted image 20250220004235.png]]


```
postgres=# \c dify
You are now connected to database "dify" as user "postgres".\
dify=# \dt

List of relations
 
 Schema |               Name                | Type  |  Owner
--------+-----------------------------------+-------+----------
 public | account_integrates                | table | postgres
 public | account_plugin_permissions        | table | postgres
 public | accounts                          | table | postgres
 public | alembic_version                   | table | postgres
 public | api_based_extensions              | table | postgres
 public | api_requests                      | table | postgres
 public | api_tokens                        | table | postgres
 public | app_annotation_hit_histories      | table | postgres
 public | app_annotation_settings           | table | postgres
 public | app_dataset_joins                 | table | postgres
 public | app_model_configs                 | table | postgres
 public | apps                              | table | postgres
 public | celery_taskmeta                   | table | postgres
 public | celery_tasksetmeta                | table | postgres
 public | child_chunks                      | table | postgres
 public | conversations                     | table | postgres
 public | data_source_api_key_auth_bindings | table | postgres
 public | data_source_oauth_bindings        | table | postgres
 public | dataset_auto_disable_logs         | table | postgres
 public | dataset_collection_bindings       | table | postgres
 public | dataset_keyword_tables            | table | postgres
 public | dataset_permissions               | table | postgres
 public | dataset_process_rules             | table | postgres
 public | dataset_queries                   | table | postgres
 public | dataset_retriever_resources       | table | postgres
 public | datasets                          | table | postgres
 public | dify_setups                       | table | postgres
 public | document_segments                 | table | postgres
 public | documents                         | table | postgres
 public | embeddings                        | table | postgres
 public | end_users                         | table | postgres
 public | external_knowledge_apis           | table | postgres
 public | external_knowledge_bindings       | table | postgres
 public | installed_apps                    | table | postgres
 public | invitation_codes                  | table | postgres
 public | load_balancing_model_configs      | table | postgres
 public | message_agent_thoughts            | table | postgres
 public | message_annotations               | table | postgres
 public | message_chains                    | table | postgres
 public | message_feedbacks                 | table | postgres
 public | message_files                     | table | postgres
 public | messages                          | table | postgres
 public | operation_logs                    | table | postgres
 public | pinned_conversations              | table | postgres
 public | provider_model_settings           | table | postgres
 public | provider_models                   | table | postgres
 public | provider_orders                   | table | postgres
 public | providers                         | table | postgres
 public | recommended_apps                  | table | postgres
 public | saved_messages                    | table | postgres
 public | sites                             | table | postgres
 public | tag_bindings                      | table | postgres
 public | tags                              | table | postgres
 public | tenant_account_joins              | table | postgres
 public | tenant_default_models             | table | postgres
 public | tenant_preferred_model_providers  | table | postgres
 public | tenants                           | table | postgres
 public | tidb_auth_bindings                | table | postgres
 public | tool_api_providers                | table | postgres
 public | tool_builtin_providers            | table | postgres
 public | tool_conversation_variables       | table | postgres
 public | tool_files                        | table | postgres
 public | tool_label_bindings               | table | postgres
 public | tool_model_invokes                | table | postgres
 public | tool_published_apps               | table | postgres
 public | tool_workflow_providers           | table | postgres
 public | trace_app_config                  | table | postgres
 public | upload_files                      | table | postgres
 public | whitelists                        | table | postgres
 public | workflow_app_logs                 | table | postgres
 public | workflow_conversation_variables   | table | postgres
 public | workflow_node_executions          | table | postgres
 public | workflow_runs                     | table | postgres
 public | workflows                         | table | postgres
(74 rows)
```

![[Pasted image 20250220004710.png]]

![[Pasted image 20250220005050.png]]

