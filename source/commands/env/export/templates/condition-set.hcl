{{#each rules}}
resource "permitio_condition_set_rule" "{{key}}" {
  user_set     = permitio_user_set.{{userSet}}.key
  permission   = "{{permission}}"
  resource_set = permitio_resource_set.{{resourceSet}}.key
  depends_on   = [
    permitio_resource_set.{{resourceSet}},
    permitio_user_set.{{userSet}}
  ]
}
{{/each}}