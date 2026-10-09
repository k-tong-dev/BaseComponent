"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  Button,
  IconButton,
  Input,
  NumberInput,
  Checkbox,
  SelectPicker,
} from "rsuite";
import { VscEdit, VscSave, VscRemove, VscAdd } from "react-icons/vsc";
import { FieldWidgetProps } from "./index";
import { showWizardError } from "../../Wizard";
import { IoIosCreate } from "react-icons/io";
import {Switch} from "@/components/ui/switch";
import {Many2ManyField} from "@/components/Base/Fields";

const { Column, HeaderCell, Cell } = Table;

const styles = `
.table-cell-editing .rs-table-cell-content {
  padding: 4px;
}
.table-cell-editing .rs-input {
  width: 100%;
}
`;

/**
 * Many2Many Widget Configuration
 * Similar to Odoo's Many2Many field with junction table support
 */
export interface Many2ManyWidgetConfig {
  // Junction table configuration (required for many2many)
  junctionTable?: string; // API endpoint for junction records (e.g., '/api/dashboard/product-attributes-rel')
  localField: string; // FK to parent in junction (e.g., 'product_id')
  remoteField: string; // FK to related in junction (e.g., 'attribute_id')

  // Related record configuration
  relation: string; // API endpoint for related records (e.g., '/api/dashboard/product-attributes')
  displayField?: string; // Field to display from related record (default: 'name')
  valueField?: string; // Field to use as value (default: 'id')
  searchField?: string; // Field to search on server (default: displayField)

  // Domain and context
  domain?: any; // Optional filter for related records
  context?: Record<string, any>;

  // Dynamic fetching options (Odoo-style)
  limit?: number; // Max results per request (default: 50)
  minSearchLength?: number; // Min chars to trigger server search (default: 0)
  searchDelay?: number; // Debounce delay for search (default: 300ms)

  // Inline editing of junction data
  columns?: Array<{
    key: string; // Can be a field from junction table or prefixed related record
    title: string;
    width?: number;
    type?: "string" | "number" | "boolean" | "select" | "many2one" | "tags";
    editable?: boolean;
    required?: boolean;
    options?: Array<{ label: string; value: string }>;
    relation?: string;
    displayField?: string;
    valueField?: string;
  }>;

  // Display options
  mode?: "list" | "tags" | "kanban"; // Display mode (default: 'list')

  // Kanban-specific options
  kanbanGroupField?: string; // Field to group by in kanban mode (default: 'state' or 'status')
  kanbanGroupOptions?: Array<{
    // Options for grouping field
    value: string;
    label: string;
    color?: string;
  }>;
  kanbanTitleField?: string; // Field to display as card title (default: displayField)
  kanbanSubtitleField?: string; // Field to display as card subtitle
  kanbanColorField?: string; // Field that contains color value

  // Actions
  allowSelect?: boolean; // Allow selecting existing records
  allowCreate?: boolean; // Allow creating new related records
  allowRemove?: boolean; // Allow removing (unlinking) records
  allowEdit?: boolean; // Allow editing junction data
}

/**
 * Many2Many Widget - Odoo-style many-to-many relationship field
 * Manages junction table records for many-to-many relationships
 */
export const Many2ManyWidget: React.FC<FieldWidgetProps> = ({
  value,
  onChange,
  field,
  data: formData,
  disabled,
  readonly,
}) => {
  const [items, setItems] = useState<any[]>(value || []);
  const [relatedOptions, setRelatedOptions] = useState<any[]>([]);
  const [originalItemIds, setOriginalItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [columnOptions, setColumnOptions] = useState<Record<string, any[]>>({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const [hasFetched, setHasFetched] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true) }, [])

  const config = field.widgetConfig as Many2ManyWidgetConfig;
  const parentId = formData?.id;

  // Developer validation
  if (typeof window !== 'undefined') {
    if (!config) {
      showWizardError(
        '[Many2ManyWidget] Missing widgetConfig',
        'You must provide a widgetConfig with at least "relation", "localField", and "remoteField". Example: { relation: "/api/dashboard/related-records", localField: "parent_id", remoteField: "related_id" }'
      )
    } else if (!config.relation || !config.localField || !config.remoteField) {
      showWizardError(
        '[Many2ManyWidget] Missing required config',
        `Missing: ${!config.relation ? 'relation ' : ''}${!config.localField ? 'localField ' : ''}${!config.remoteField ? 'remoteField' : ''}. Example: { relation: "/api/dashboard/related-records", localField: "parent_id", remoteField: "related_id" }`
      )
    }
  }

  // Guard: show fallback UI instead of crashing when config is missing
  if (!config || !config.relation || !config.localField || !config.remoteField) {
    return (
      <div className="border border-destructive/30 rounded-md p-4 bg-destructive/5">
        <p className="text-sm text-destructive font-medium">Many2ManyWidget configuration error</p>
        <p className="text-xs text-muted-foreground mt-1">
          Missing required widgetConfig properties (<code>relation</code>, <code>localField</code>, <code>remoteField</code>). A warning has been shown.
        </p>
      </div>
    )
  }

  // Track original items from initial API load
  useEffect(() => {
    if (value && value.length > 0) {
      const ids: Set<string> = new Set(value.map((item: any) => String(item.id || item.attribute_id)))
      setOriginalItemIds(ids)
    }
  }, [value])
  const mode = config.mode || "list";

  // Sync with external value
  useEffect(() => {
    setItems(value || []);
  }, [value]);

  // Dynamic fetch for related records (fetch on demand)
  const fetchRelatedOptions = useCallback(
    async (search?: string) => {
      if (!config.relation) return;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search && search.length > 0) {
          params.append(
            `${config.searchField || config.displayField || "name"}_like`,
            search,
          );
        }
        if (config.limit) {
          params.append("limit", config.limit.toString());
        }
        if (config.domain) {
          params.append("domain", JSON.stringify(config.domain));
        }

        const queryString = params.toString();
        const url = `${config.relation}${queryString ? `?${queryString}` : ""}`;

        const response = await fetch(url);
        const data = await response.json();

        const options = (
          Array.isArray(data) ? data : data.rows || data.items || []
        ).map((item: any) => ({
          ...item,
          label: item[config.displayField || "name"],
          value: item[config.valueField || "id"],
        }));

        setRelatedOptions(options);
        setHasFetched(true);
      } catch (error) {
        showWizardError("[Many2ManyWidget] Failed to fetch related records", String(error));
      } finally {
        setLoading(false);
      }
    },
    [
      config.relation,
      config.displayField,
      config.valueField,
      config.searchField,
      config.limit,
      config.domain,
    ],
  );

  // Fetch when selector opens
  const handleOpenSelector = useCallback(() => {
    if (!hasFetched) {
      fetchRelatedOptions();
    }
    setShowSelector(true);
  }, [hasFetched, fetchRelatedOptions]);

  // Handle search in selector with debounce
  const handleSelectorSearch = useCallback(
    (query: string) => {
      setSearchKeyword(query);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (query.length >= (config.minSearchLength || 0)) {
          fetchRelatedOptions(query);
        } else if (query.length === 0) {
          fetchRelatedOptions();
        }
      }, config.searchDelay || 300);
    },
    [fetchRelatedOptions, config.minSearchLength, config.searchDelay],
  );

  // Fetch options for many2one columns
  useEffect(() => {
    const fetchOptions = async () => {
      if (!config.columns) return;

      const newOptions: Record<string, any[]> = {};

      for (const col of config.columns) {
        if (col.type === "many2one" && col.relation) {
          try {
            const response = await fetch(col.relation);
            const data = await response.json();
            newOptions[col.key] = data.map((item: any) => ({
              label: item[col.displayField || "name"],
              value: item[col.valueField || "id"],
            }));
          } catch (error) {
            showWizardError(`[Many2ManyWidget] Failed to fetch options for ${col.key}`, String(error));
          }
        }
      }

      setColumnOptions(newOptions);
    };

    fetchOptions();
  }, [config.columns]);

  // Notify parent of changes
  const notifyChange = useCallback(
    (newItems: any[]) => {
      setItems(newItems);
      onChange(newItems);
    },
    [onChange],
  );

  // Add/link existing records
  const handleSelect = (selectedValues: string[]) => {
    const newItems: any[] = [];

    selectedValues.forEach((value) => {
      // Check if this record is already in the list
      const existingItem = items.find(
        (i) =>
          !i._toDelete &&
          (i[config.remoteField] === value || i.id === value || i._related?.id === value),
      );

      if (!existingItem) {
        // Check if this was an original item from API load
        const isOriginal = originalItemIds.has(value);

        // Create new item with flattened data structure (consistent with API items)
        const related = relatedOptions.find((r) => r.value === value);
        newItems.push({
          id: related?.id || value,
          name: related?.name || related?.label,
          type: related?.type,
          position: related?.position,
          created_at: related?.created_at,
          updated_at: related?.updated_at,
          create_uid: related?.create_uid,
          write_uid: related?.write_uid,
          [config.localField]: parentId || null,
          [config.remoteField]: value,
          isNew: !isOriginal, // Only set isNew if it's not an original item
        });
      }
    });

    notifyChange([...items.filter((i) => !i._toDelete), ...newItems]);
    setShowSelector(false);
  };

  // Unlink (mark for deletion)
  const handleUnlink = (id: string) => {
    const newItems = items.map(i =>
      i.id === id ? { ...i, _toDelete: true } : i
    )
    notifyChange(newItems)
  };

  // Toggle edit mode for junction data
  const handleEdit = (id: string) => {
    if (!config.allowEdit) return;
    setEditingId(editingId === id ? null : id);
  };

  // Save junction data changes
  const handleSave = (id: string) => {
    setEditingId(null);
    // Mark item as changed if it's not new
    const newItems = items.map(item => {
      if (item.id === id && !item.isNew) {
        return { ...item, isChanged: true };
      }
      return item;
    });
    notifyChange(newItems);
  };

  // Update junction field value
  const handleFieldChange = (id: string, key: string, newValue: any) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, [key]: newValue, isChanged: true };
      }
      return item;
    });
    setItems(newItems);
  };

  // Get available options (exclude already linked)
  const getAvailableOptions = useCallback(() => {
    const linkedIds = items.filter(i => !i._toDelete).map((i) => i[config.remoteField] || i.id);
    return relatedOptions.filter((o) => !linkedIds.includes(o.value));
  }, [items, relatedOptions, config.remoteField]);

  // Render editable cell for junction data
  const EditableCell = ({ rowData, dataKey, column, ...props }: any) => {
    const isEditing = editingId === rowData.id && column.editable !== false;
    const value = rowData[dataKey];

    if (!isEditing) {
      // Display mode
      if (column.type === "boolean") {
        return <Cell {...props}>{value ? "Yes" : "No"}</Cell>;
      }
      if (column.type === "many2one") {
        const options = columnOptions[dataKey] || [];
        const selected = options.find((o: any) => o.value === value);
        return <Cell {...props}>{selected?.label ?? value ?? "-"}</Cell>;
      }
      if (column.type === "select") {
        const selected = column.options?.find((o: any) => o.value === value);
        return <Cell {...props}>{selected?.label ?? value ?? "-"}</Cell>;
      }
      return <Cell {...props}>{value ?? "-"}</Cell>;
    }

    // Edit mode
    const commonProps = {
      value,
      onChange: (newValue: any) =>
        handleFieldChange(rowData.id, dataKey, newValue),
      disabled,
      size: "sm" as const,
    };

    return (
      <Cell {...props} className="table-cell-editing">
        {column.type === "boolean" ? (
          <Switch {...commonProps} checked={value || false} />
        ) : column.type === "number" ? (
          <NumberInput {...commonProps} />
        ) : column.type === "many2one" ? (
          <SelectPicker
            {...commonProps}
            data={columnOptions[dataKey] || []}
            block
          />
        ) : column.type === "select" ? (
          <SelectPicker {...commonProps} data={column.options || []} block />
        ) : (
          <Input {...commonProps} />
        )}
      </Cell>
    );
  };

  // Action cell
  const ActionCell = ({ rowData, ...props }: any) => {
    const isEditing = editingId === rowData.id;
    const showEdit =
      config.allowEdit && !readonly && !disabled && config.columns;
    const showUnlink = config.allowRemove !== false && !readonly && !disabled;

    console.log("[Many2ManyWidget] ActionCell render:", {
      rowData,
      isEditing,
      showEdit,
      showUnlink,
      config: {
        allowEdit: config.allowEdit,
        allowRemove: config.allowRemove,
        columns: !!config.columns,
      },
    });

    return (
      <Cell {...props} style={{ padding: "6px", display: "flex", gap: "4px" }}>
        {showEdit && (
          <IconButton
            appearance="link"
            color="violet"
            icon={isEditing ? <VscSave /> : <VscEdit />}
            onClick={() => {
              console.log("[Many2ManyWidget] Edit button clicked:", {
                id: rowData.id,
                isEditing,
              });
              isEditing ? handleSave(rowData.id) : handleEdit(rowData.id);
            }}
            size="sm"
          />
        )}
        {showUnlink && (
          <IconButton
            appearance="link"
            icon={<VscRemove />}
            onClick={() => {
              console.log(
                "[Many2ManyWidget] Unlink button clicked:",
                rowData.id,
              );
              handleUnlink(rowData.id);
            }}
            size="sm"
            color="red"
          />
        )}
      </Cell>
    );
  };

  // Hydration safety — ensure consistent SSR + client render
  if (!mounted) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2" />
      </div>
    )
  }

  // Kanban mode display
  if (mode === "kanban") {
    const groupField = config.kanbanGroupField || "state";
    const titleField = config.kanbanTitleField || config.displayField || "name";
    const subtitleField = config.kanbanSubtitleField;
    const groupOptions = config.kanbanGroupOptions || [];

    // Group items by the group field
    const groupedItems: Record<string, any[]> = {};

    // Initialize groups from groupOptions
    groupOptions.forEach((opt) => {
      groupedItems[opt.value] = [];
    });

    // Group active items
    items
      .filter((i) => !i._toDelete)
      .forEach((item) => {
        // Get the group value from the item
        const groupValue = item[groupField] || "ungrouped";
        if (!groupedItems[groupValue]) {
          groupedItems[groupValue] = [];
        }
        groupedItems[groupValue].push(item);
      });

    // Get color for a group
    const getGroupColor = (groupValue: string) => {
      const option = groupOptions.find((o) => o.value === groupValue);
      return option?.color || "gray";
    };

    // Get label for a group
    const getGroupLabel = (groupValue: string) => {
      const option = groupOptions.find((o) => o.value === groupValue);
      return option?.label || groupValue;
    };

    // Color variants for Tailwind
    const colorVariants: Record<string, string> = {
      blue: "border-blue-500 bg-blue-50",
      green: "border-green-500 bg-green-50",
      yellow: "border-yellow-500 bg-yellow-50",
      red: "border-red-500 bg-red-50",
      purple: "border-purple-500 bg-purple-50",
      orange: "border-orange-500 bg-orange-50",
      gray: "border-gray-400 bg-gray-50",
    };

    const dotColorVariants: Record<string, string> = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      gray: "bg-gray-400",
    };

    return (
      <div className="space-y-3">
        {/* Header with add button */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">
            {items.filter((i) => !i._toDelete).length} linked records
          </span>
          {config.allowSelect && !readonly && !disabled && (
            <Button
              onClick={() => setShowSelector(!showSelector)}
              appearance="default"
              size="sm"
              style={{ color: "#531ba8", backgroundColor: "transparent" }}
              disabled={disabled}
              startIcon={<IoIosCreate />}
            >
              Add lines
            </Button>
          )}
        </div>

        {/* Selector */}
        {showSelector && (
          <div className="p-3 border rounded bg-gray-50">
            <SelectPicker
              data={getAvailableOptions()}
              value={null}
              searchable={true}
              loading={loading}
              onSearch={handleSelectorSearch}
              onSelect={(value) => {
                if (value) {
                  handleSelect([value as string]);
                }
              }}
              onClose={() => setSearchKeyword("")}
              placeholder="Search and select a record to link..."
              block
              size="sm"
              style={{ outlineColor: "transparent" }}
              cleanable={true}
            />
          </div>
        )}

        {/* Kanban columns */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Object.entries(groupedItems).map(([groupValue, groupItems]) => {
            const color = getGroupColor(groupValue);
            const label = getGroupLabel(groupValue);
            const colorVariant = colorVariants[color] || colorVariants.gray;
            const dotColor = dotColorVariants[color] || dotColorVariants.gray;

            return (
              <div
                key={groupValue}
                className="flex-shrink-0 w-64 border rounded-lg overflow-hidden"
              >
                {/* Column header */}
                <div
                  className={`px-3 py-2 border-b flex items-center justify-between ${colorVariant}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                    <span className="font-medium text-sm text-gray-700">
                      {label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                    {groupItems.length}
                  </span>
                </div>

                {/* Column items */}
                <div className="p-2 space-y-2 max-h-64 overflow-y-auto">
                  {groupItems.map((item) => {
                    const related =
                      item._related ||
                      relatedOptions.find(
                        (r) => r.value === item[config.remoteField],
                      );
                    const title =
                      related?.[titleField] ||
                      item[titleField] ||
                      item.name ||
                      item.id ||
                      "Untitled";
                    const subtitle = subtitleField
                      ? related?.[subtitleField] || item[subtitleField]
                      : null;

                    return (
                      <div
                        key={item.id}
                        className="p-2 border rounded bg-white hover:shadow-sm transition-shadow cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {title}
                            </div>
                            {subtitle && (
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {subtitle}
                              </div>
                            )}
                          </div>
                          {config.allowRemove !== false &&
                            !readonly &&
                            !disabled && (
                              <button
                                onClick={() => handleUnlink(item.id)}
                                className="text-gray-400 hover:text-red-500 flex-shrink-0"
                              >
                                <VscRemove size={14} />
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  })}
                  {groupItems.length === 0 && (
                    <div className="text-center text-xs text-gray-400 py-4">
                      No items
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Tags mode — delegates to Many2ManyField
  if (mode === 'tags') {
    const fieldValue = value || []
    return (
      <Many2ManyField
        config={{
          name: field.key,
          type: 'many2many',
          label: field.label,
          placeholder: config.allowCreate ? 'Type to create or select...' : 'Select...',
          fetchUrl: config.relation,
          readonly,
          size: 'md',
        }}
        value={fieldValue}
        onChange={onChange}
      />
    )
  }

  // List mode (default)
  if (readonly || disabled) {
    return (
      <div className="border rounded p-4 bg-gray-50">
        <p className="text-xs text-gray-500">
          {items.filter((i) => !i._toDelete).length} linked records (read-only)
        </p>
      </div>
    );
  }

  const activeItems = items.filter((i) => !i._toDelete);
  const shouldShowActionBar =
    activeItems.length > 0 || (config.allowSelect && activeItems.length === 0);
  console.log("------------------------ Items: ", JSON.stringify(items, null, 2));
  return (
    <>
      <style>{styles}</style>
      <div className="space-y-2">
        {shouldShowActionBar && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">
              {activeItems.length} linked records
            </span>
            {config.allowSelect && (
              <div className="flex gap-2">
                <Button
                  onClick={handleOpenSelector}
                  appearance="default"
                  size="sm"
                  style={{ color: "#531ba8", backgroundColor: "transparent" }}
                  disabled={disabled}
                  startIcon={<IoIosCreate />}
                >
                  Add lines
                </Button>
              </div>
            )}
          </div>
        )}

        {showSelector && (
          <div className="p-3 rounded">
            <SelectPicker
              data={getAvailableOptions()}
              value={null}
              searchable={true}
              loading={loading}
              onSearch={handleSelectorSearch}
              onSelect={(value) => {
                if (value) {
                  handleSelect([value as string]);
                }
              }}
              onClose={() => setSearchKeyword("")}
              placeholder="Search and select a record to link..."
              block
              size="md"
              style={{ outlineColor: "transparent" }}
              cleanable={true}
            />
          </div>
        )}

        {config.columns && config.columns.length > 0 ? (
          <Table
            height={300}
            data={activeItems}
            autoHeight={activeItems.length === 0}
            bordered={false}
            cellBordered={false}
          >
            {/* Related record display column */}
            {/*<Column flexGrow={1} resizable={true}>*/}
            {/*  <HeaderCell className={"uppercase"}>{config.displayField || 'Name'}</HeaderCell>*/}
            {/*  <Cell>*/}
            {/*    {(rowData: any) => {*/}
            {/*      // API returns full data directly: name, type, position, etc.*/}
            {/*      // Fallback to _related for backwards compatibility or relatedOptions for new items*/}
            {/*      const displayValue = rowData[config.displayField || 'name']*/}
            {/*        || rowData.name*/}
            {/*        || rowData._related?.label*/}
            {/*        || relatedOptions.find(r => r.value === rowData[config.remoteField])?.label*/}
            {/*        || rowData[config.remoteField]*/}
            {/*        || '-'*/}
            {/*      return <span>{displayValue}</span>*/}
            {/*    }}*/}
            {/*  </Cell>*/}
            {/*</Column>*/}

            {/* Junction data columns */}
            {config.columns.map((col) => (
              <Column key={col.key} width={col.width || 100} resizable={true}>
                <HeaderCell className={"uppercase"}>{col.title}</HeaderCell>
                <EditableCell dataKey={col.key} column={col} />
              </Column>
            ))}

            <Column width={80} align="center" fixed="right">
              <HeaderCell className={"uppercase"}>Action</HeaderCell>
              <ActionCell dataKey="id" />
            </Column>
          </Table>
        ) : (
          // Simple list without junction data columns
          <div className="border rounded divide-y">
            {activeItems.map((item) => {
              const displayValue =
                item[config.displayField || "name"] ||
                item.name ||
                item.id ||
                "Undefined";
              return (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-2 hover:bg-gray-50"
                >
                  <span>{displayValue}</span>
                  {config.allowRemove !== false && (
                    <IconButton
                      appearance="link"
                      icon={<VscRemove />}
                      onClick={() => handleUnlink(item.id)}
                      size="sm"
                      color="red"
                    />
                  )}
                </div>
              );
            })}
            {items.filter((i) => !i._toDelete).length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No linked records
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
(Many2ManyWidget as any).widgetName = "many2many";

export default Many2ManyWidget;
