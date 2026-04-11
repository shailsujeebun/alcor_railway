'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    createAdminTemplate,
    createTemplateBlock,
    deleteTemplateBlock,
    FormField,
    FormTemplate,
    getTemplateBlocks,
    getAdminTemplate,
    getCategories,
    getCategoryTemplateByCategory,
    updateTemplateBlock,
    updateAdminTemplate,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/providers/translation-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ChevronDown, Plus, Save, Trash } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { TemplateBlockSchema } from '@/lib/schemaTypes';
import { getCategoryDisplayName } from '@/lib/display-labels';

interface CategoryNode {
    id: string;
    name: string;
    children?: CategoryNode[];
}

const DEFAULT_SECTION = 'General Information';

export default function AdminTemplatesPage() {
    const { locale } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [templateName, setTemplateName] = useState('');
    const [existingTemplateId, setExistingTemplateId] = useState<number | null>(null);

    const [sections, setSections] = useState<string[]>([DEFAULT_SECTION]);
    const [fields, setFields] = useState<Partial<FormField>[]>([]);
    const [blocks, setBlocks] = useState<TemplateBlockSchema[]>([]);
    const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
    const [newBlockName, setNewBlockName] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
    const [collapsedFields, setCollapsedFields] = useState<Record<number, boolean>>({});
    const [collapsedAdvancedFields, setCollapsedAdvancedFields] = useState<Record<number, boolean>>({});

    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryIdParam = searchParams.get('categoryId');
    const templateIdParam = searchParams.get('templateId');

    const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
    const [selectionPath, setSelectionPath] = useState<string[]>([]);

    const getSectionsFromFields = (nextFields: Partial<FormField>[]) => {
        const uniqueSections = Array.from(
            new Set(nextFields.map((field) => field.section).filter(Boolean)),
        ) as string[];

        return uniqueSections.length > 0 ? uniqueSections : [DEFAULT_SECTION];
    };

    const resetTemplateEditor = () => {
        setExistingTemplateId(null);
        setTemplateName('');
        setFields([]);
        setSections([DEFAULT_SECTION]);
        setSelectedBlockIds([]);
        setCollapsedSections({});
        setCollapsedFields({});
        setCollapsedAdvancedFields({});
    };

    const applyTemplateToEditor = (template: FormTemplate) => {
        const sourceFields =
            template.fields && template.fields.length > 0
                ? template.fields
                : (template.resolvedFields ?? []);

        const loadedFields: Partial<FormField>[] = sourceFields.map((field) => ({
            id: field.id,
            key: field.key,
            label: field.label,
            type: field.type,
            isRequired: field.isRequired,
            section: field.section ?? undefined,
            validationRules: field.validationRules,
            options: field.options ?? [],
            component: field.component,
            required: field.required ?? field.isRequired,
            placeholder: field.placeholder,
            group: field.group ?? field.section,
            order: field.order,
            dataSource: field.dataSource,
            staticOptions: field.staticOptions ?? field.options ?? [],
            optionsEndpoint: field.optionsEndpoint,
            optionsQuery: field.optionsQuery,
            dependsOn: field.dependsOn ?? [],
            optionsMapping: field.optionsMapping,
            visibleIf: field.visibleIf,
            requiredIf: field.requiredIf,
            resetOnChange: field.resetOnChange ?? [],
        }));

        setExistingTemplateId(Number(template.id));
        setTemplateName(`Template v${template.version}`);
        setSelectedCategory(template.categoryId.toString());
        setFields(loadedFields);
        const nextSections = getSectionsFromFields(loadedFields);
        setSections(nextSections);
        setSelectedBlockIds(template.blockIds ?? []);
        setCollapsedSections(
            nextSections.reduce<Record<string, boolean>>((acc, section, index) => {
                acc[section] = index > 0;
                return acc;
            }, {}),
        );
        setCollapsedFields(
            loadedFields.reduce<Record<number, boolean>>((acc, _field, index) => {
                acc[index] = false;
                return acc;
            }, {}),
        );
        setCollapsedAdvancedFields(
            loadedFields.reduce<Record<number, boolean>>((acc, _field, index) => {
                acc[index] = true;
                return acc;
            }, {}),
        );
    };

    const findPath = (nodes: CategoryNode[], targetId: string): string[] | null => {
        for (const node of nodes) {
            if (node.id.toString() === targetId) return [node.id.toString()];
            if (node.children?.length) {
                const childPath = findPath(node.children, targetId);
                if (childPath) return [node.id.toString(), ...childPath];
            }
        }
        return null;
    };

    const loadTemplateForCategory = async (categoryId: string) => {
        try {
            const template = await getCategoryTemplateByCategory(Number(categoryId));
            if (!template) {
                resetTemplateEditor();
                return;
            }
            applyTemplateToEditor(template);
        } catch (error) {
            console.error('Failed to fetch template:', error);
            resetTemplateEditor();
        }
    };

    useEffect(() => {
        let isActive = true;

        async function load() {
            try {
                const [data, allBlocks] = await Promise.all([
                    getCategories(),
                    getTemplateBlocks().catch(() => []),
                ]);
                if (!isActive) return;

                setCategoryTree(data as CategoryNode[]);
                setBlocks(allBlocks as TemplateBlockSchema[]);

                if (templateIdParam) {
                    const template = await getAdminTemplate(Number(templateIdParam));
                    if (!isActive || !template) return;

                    applyTemplateToEditor(template);

                    const path = findPath(data as CategoryNode[], template.categoryId.toString());
                    if (path) {
                        setSelectionPath(path);
                    } else {
                        setSelectionPath([template.categoryId.toString()]);
                    }
                    return;
                }

                if (categoryIdParam) {
                    setSelectedCategory(categoryIdParam);

                    const path = findPath(data as CategoryNode[], categoryIdParam.toString());
                    if (path) setSelectionPath(path);

                    await loadTemplateForCategory(categoryIdParam);
                }
            } catch (error) {
                console.error('Failed to load categories/templates:', error);
            }
        }

        load();

        return () => {
            isActive = false;
        };
    }, [templateIdParam, categoryIdParam]);

    const handleLevelSelect = async (level: number, id: string) => {
        const newPath = selectionPath.slice(0, level);
        newPath.push(id);
        setSelectionPath(newPath);
        setSelectedCategory(id);

        await loadTemplateForCategory(id);
    };

    const getLevelOptions = (level: number): CategoryNode[] => {
        if (level === 0) return categoryTree;

        let currentLevel: CategoryNode[] = categoryTree;
        for (let i = 0; i < level; i++) {
            const node = currentLevel.find((item) => item.id.toString() === selectionPath[i]);
            if (node?.children) {
                currentLevel = node.children;
            } else {
                return [];
            }
        }

        return currentLevel;
    };

    const levels = useMemo(() => {
        const calculatedLevels = [0];
        let currentNodes: CategoryNode[] = categoryTree;

        for (let i = 0; i < selectionPath.length; i++) {
            const id = selectionPath[i];
            const node = currentNodes.find((item) => item.id.toString() === id);

            if (node?.children?.length) {
                calculatedLevels.push(i + 1);
                currentNodes = node.children;
            } else {
                break;
            }
        }

        return calculatedLevels;
    }, [categoryTree, selectionPath]);

    function addSection() {
        const name = prompt('Enter section name (e.g., Engine Options, Dimensions):');
        if (name && !sections.includes(name)) {
            setSections([...sections, name]);
            setCollapsedSections((prev) => ({ ...prev, [name]: false }));
        }
    }

    function deleteSection(sectionName: string) {
        if (confirm(`Delete section "${sectionName}" and all its fields?`)) {
            setSections(sections.filter((section) => section !== sectionName));
            setFields(fields.filter((field) => field.section !== sectionName));
            setCollapsedSections((prev) => {
                const next = { ...prev };
                delete next[sectionName];
                return next;
            });
        }
    }

    function addField(section: string) {
        const nextIndex = fields.length;
        setCollapsedFields((prev) => ({ ...prev, [nextIndex]: false }));
        setCollapsedAdvancedFields((prev) => ({ ...prev, [nextIndex]: true }));
        setFields([
            ...fields,
            {
                key: `field_${Date.now()}`,
                label: 'New Field',
                type: 'TEXT',
                isRequired: false,
                section,
                options: [],
                component: 'text',
                required: false,
                dataSource: 'static',
                staticOptions: [],
                dependsOn: [],
                visibleIf: undefined,
                requiredIf: undefined,
                resetOnChange: [],
            },
        ]);
    }

    function updateField(index: number, updates: Partial<FormField>) {
        const nextFields = [...fields];
        nextFields[index] = { ...nextFields[index], ...updates };
        setFields(nextFields);
    }

    function removeField(index: number) {
        setFields(fields.filter((_, fieldIndex) => fieldIndex !== index));
        setCollapsedFields((prev) => {
            const next: Record<number, boolean> = {};
            Object.entries(prev).forEach(([rawKey, value]) => {
                const key = Number(rawKey);
                if (key < index) next[key] = value;
                if (key > index) next[key - 1] = value;
            });
            return next;
        });
        setCollapsedAdvancedFields((prev) => {
            const next: Record<number, boolean> = {};
            Object.entries(prev).forEach(([rawKey, value]) => {
                const key = Number(rawKey);
                if (key < index) next[key] = value;
                if (key > index) next[key - 1] = value;
            });
            return next;
        });
    }

    function toggleSection(section: string) {
        setCollapsedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    }

    function toggleField(index: number) {
        setCollapsedFields((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    }

    function toggleAdvancedField(index: number) {
        setCollapsedAdvancedFields((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    }

    function addOption(fieldIndex: number) {
        const field = fields[fieldIndex];
        const newOption = {
            id: `opt_${Date.now()}`,
            label: 'Option',
            value: 'value',
        };
        const updatedOptions = [...(field.options || []), newOption];
        updateField(fieldIndex, { options: updatedOptions as any });
    }

    function updateOption(fieldIndex: number, optIndex: number, key: 'label' | 'value', val: string) {
        const field = fields[fieldIndex];
        if (!field.options) return;

        const newOptions = [...field.options];
        newOptions[optIndex] = { ...newOptions[optIndex], [key]: val };
        updateField(fieldIndex, { options: newOptions });
    }

    async function handleSave(asNew = false) {
        if (!selectedCategory) return alert('Select a category');
        if (fields.length === 0) return alert('Add at least one field');

        try {
            setIsLoading(true);

            const sanitizeKey = (key: string | undefined, fallback: string): string => {
                if (!key) return fallback;
                return key.toLowerCase().replace(/[^a-z0-9_]/g, '_');
            };

            const keyCount = new Map<string, number>();
            const cleanFields = fields.map((field, index) => {
                const baseKey = sanitizeKey(field.key, `field_${index}`);
                const count = keyCount.get(baseKey) || 0;
                keyCount.set(baseKey, count + 1);
                const finalKey = count > 0 ? `${baseKey}_${count}` : baseKey;

                return {
                    key: finalKey,
                    label: field.label || 'Unnamed Field',
                    type: field.type || 'TEXT',
                    required: field.isRequired || false,
                    component: field.component || 'text',
                    placeholder: field.placeholder,
                    group: field.group || field.section,
                    section: field.group || field.section,
                    order: index,
                    options: field.options?.map((option) => ({
                        label: option.label,
                        value: option.value,
                    })),
                    dataSource: field.dataSource || 'static',
                    staticOptions:
                        field.staticOptions?.map((option: any) => ({
                            label: option.label,
                            value: option.value,
                        })) ??
                        field.options?.map((option) => ({
                            label: option.label,
                            value: option.value,
                        })) ??
                        [],
                    optionsEndpoint: field.optionsEndpoint,
                    optionsQuery: field.optionsQuery,
                    dependsOn: field.dependsOn || [],
                    optionsMapping: field.optionsMapping,
                    visibleIf: field.visibleIf,
                    requiredIf: field.requiredIf,
                    resetOnChange: field.resetOnChange || [],
                    validationRules: field.validationRules || {},
                };
            });

            if (existingTemplateId && !asNew) {
                await updateAdminTemplate(existingTemplateId, {
                    fields: cleanFields,
                    blockIds: selectedBlockIds,
                });
                alert('Template updated successfully!');
                return;
            }

            const created = await createAdminTemplate({
                categoryId: Number(selectedCategory),
                name: templateName || 'Default Template',
                fields: cleanFields,
                blockIds: selectedBlockIds,
            });

            setExistingTemplateId(Number(created.id));
            setTemplateName(`Template v${created.version}`);
            alert(asNew ? 'New version created successfully!' : 'Template created successfully!');
            router.replace(`/admin/templates/builder?templateId=${created.id}`);
        } catch (error) {
            console.error(error);
            alert('Failed to save template');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateBlock() {
        const name = newBlockName.trim();
        if (!name) return;
        try {
            const created = await createTemplateBlock({ name, fields: [] });
            setBlocks((prev) => [...prev, created]);
            setNewBlockName('');
        } catch (error) {
            console.error(error);
            alert('Failed to create block');
        }
    }

    return (
        <div className="container-main pt-20 pb-12 max-w-6xl">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white mb-2">Form Template Builder</h1>
                    <p className="text-muted-foreground">Define custom fields and sections for category listings.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => handleSave(true)}
                        disabled={isLoading}
                        variant="outline"
                        className="bg-transparent border-white/20 hover:bg-white/10 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Save as New Version
                    </Button>
                    <Button
                        onClick={() => handleSave(false)}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-card rounded-xl p-6 border border-white/10 sticky top-24">
                        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            Settings
                        </h2>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Label className="text-muted-foreground">Category Selection</Label>

                                {levels.map((level) => {
                                    const options = getLevelOptions(level);
                                    if (!options || options.length === 0) return null;

                                    const selectedAtLevel = selectionPath[level] || '';

                                    return (
                                        <div key={level} className="space-y-1 animation-fade-in">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">
                                                {level === 0 ? 'Main Category' : level === 1 ? 'Subcategory' : `Level ${level + 1} Category`}
                                            </p>
                                            <Select
                                                key={`select-${level}-${selectedAtLevel}`}
                                                value={selectedAtLevel}
                                                onValueChange={(value) => handleLevelSelect(level, value)}
                                            >
                                                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white shadow-sm">
                                                    <SelectValue placeholder={level === 0 ? 'Select Main Category' : 'Select Subcategory'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.map((category) => (
                                                        <SelectItem key={category.id} value={category.id.toString()}>
                                                            {getCategoryDisplayName(category.name, locale)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    );
                                })}

                                {selectedCategory && (
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200">
                                        Selected: <span className="font-semibold">{selectionPath.length} levels deep</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Template Name</Label>
                                <Input
                                    value={templateName}
                                    onChange={(event) => setTemplateName(event.target.value)}
                                    placeholder="e.g. Tractors V1"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50"
                                />
                            </div>

                            <div className="space-y-3 pt-2 border-t border-white/10">
                                <Label className="text-muted-foreground">Reusable Blocks</Label>
                                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                    {blocks.map((block) => (
                                        <div key={block.id} className="flex items-center justify-between gap-2 text-sm text-white/90">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBlockIds.includes(block.id)}
                                                    onChange={(event) => {
                                                        setSelectedBlockIds((prev) =>
                                                            event.target.checked
                                                                ? [...prev, block.id]
                                                                : prev.filter((id) => id !== block.id),
                                                        );
                                                    }}
                                                />
                                                <span>{block.name}</span>
                                                {block.isSystem ? (
                                                    <span className="text-[10px] uppercase text-blue-300">system</span>
                                                ) : null}
                                            </label>
                                            {!block.isSystem ? (
                                                <div className="flex gap-1">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 px-2 text-xs"
                                                        onClick={async () => {
                                                            const nextName = prompt('Block name', block.name)?.trim();
                                                            if (!nextName) return;
                                                            try {
                                                                const updated = await updateTemplateBlock(block.id, { name: nextName });
                                                                setBlocks((prev) => prev.map((entry) => (entry.id === block.id ? updated : entry)));
                                                            } catch (error) {
                                                                console.error(error);
                                                                alert('Failed to update block');
                                                            }
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 px-2 text-xs"
                                                        onClick={async () => {
                                                            const json = prompt(
                                                                'Edit block fields JSON',
                                                                JSON.stringify(block.fields ?? [], null, 2),
                                                            );
                                                            if (json === null) return;
                                                            try {
                                                                const parsed = json.trim() ? JSON.parse(json) : [];
                                                                const updated = await updateTemplateBlock(block.id, { fields: parsed });
                                                                setBlocks((prev) => prev.map((entry) => (entry.id === block.id ? updated : entry)));
                                                            } catch (error) {
                                                                console.error(error);
                                                                alert('Invalid JSON or failed to update block fields');
                                                            }
                                                        }}
                                                    >
                                                        Fields
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 px-2 text-xs text-red-300"
                                                        onClick={async () => {
                                                            if (!confirm(`Delete block \"${block.name}\"?`)) return;
                                                            try {
                                                                await deleteTemplateBlock(block.id);
                                                                setBlocks((prev) => prev.filter((entry) => entry.id !== block.id));
                                                                setSelectedBlockIds((prev) => prev.filter((id) => id !== block.id));
                                                            } catch (error) {
                                                                console.error(error);
                                                                alert('Failed to delete block');
                                                            }
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                    {blocks.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No blocks yet.</p>
                                    ) : null}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        value={newBlockName}
                                        onChange={(event) => setNewBlockName(event.target.value)}
                                        placeholder="New block name"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50"
                                    />
                                    <Button type="button" size="sm" onClick={handleCreateBlock}>
                                        Add
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Form Sections</h2>
                        <Button onClick={addSection} variant="secondary" size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Add Section
                        </Button>
                    </div>

                    {sections.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                            <p className="text-muted-foreground mb-4">No sections defined.</p>
                            <Button onClick={addSection}>Create First Section</Button>
                        </div>
                    )}

                    {sections.map((section) => {
                        const sectionFields = fields.filter((field) => field.section === section);
                        const isSectionCollapsed = Boolean(collapsedSections[section]);

                        return (
                        <div key={section} className="glass-card rounded-xl border border-white/10 overflow-hidden">
                            <div className="bg-white/5 p-4 flex justify-between items-center border-b border-white/10">
                                <button
                                    type="button"
                                    onClick={() => toggleSection(section)}
                                    className="flex items-center gap-2 text-left text-white font-bold"
                                >
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform ${isSectionCollapsed ? '-rotate-90' : 'rotate-0'}`}
                                    />
                                    <span>{section}</span>
                                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                                        {sectionFields.length}
                                    </span>
                                </button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteSection(section)}
                                    className="text-muted-foreground hover:text-red-400"
                                >
                                    <Trash className="w-4 h-4" />
                                </Button>
                            </div>

                            <div
                                className={`p-4 space-y-4 bg-black/20 overflow-hidden transition-all duration-300 ease-out ${
                                    isSectionCollapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-[5000px] opacity-100'
                                }`}
                            >
                                {fields
                                    .map((field, index) => ({ ...field, originalIndex: index }))
                                    .filter((field) => field.section === section)
                                    .map((field) => {
                                        const index = field.originalIndex;
                                        const isFieldCollapsed = Boolean(collapsedFields[index]);
                                        const isAdvancedCollapsed = Boolean(collapsedAdvancedFields[index]);
                                        return (
                                            <div
                                                key={index}
                                                className="group relative bg-card/80 hover:bg-card border border-white/5 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-200"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleField(index)}
                                                        className="flex items-center gap-2 text-left min-w-0"
                                                    >
                                                        <ChevronDown
                                                            className={`h-4 w-4 transition-transform ${isFieldCollapsed ? '-rotate-90' : 'rotate-0'}`}
                                                        />
                                                        <span className="truncate text-sm font-semibold text-white">
                                                            {field.label || 'Untitled field'}
                                                        </span>
                                                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                                                            {field.type || 'TEXT'}
                                                        </span>
                                                    </button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-muted-foreground hover:text-red-400 hover:bg-red-950/20"
                                                        onClick={() => removeField(index)}
                                                    >
                                                        <Trash className="w-4 h-4 mr-2" />
                                                        Remove
                                                    </Button>
                                                </div>

                                                <div
                                                    className={`pl-2 mt-4 overflow-hidden border-t border-white/5 transition-all duration-300 ease-out ${
                                                        isFieldCollapsed ? 'max-h-0 opacity-0 pt-0' : 'max-h-[4200px] opacity-100 pt-4'
                                                    }`}
                                                >
                                                    <div className="space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs uppercase text-muted-foreground">Field Label</Label>
                                                            <Input
                                                                value={field.label}
                                                                onChange={(event) =>
                                                                    updateField(index, {
                                                                        label: event.target.value,
                                                                        key: event.target.value.toLowerCase().replace(/\s+/g, '_'),
                                                                    })
                                                                }
                                                                className="bg-black/20 border-white/10"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs uppercase text-muted-foreground">Field Type</Label>
                                                            <Select
                                                                value={field.type || 'TEXT'}
                                                                onValueChange={(value: any) => updateField(index, { type: value })}
                                                            >
                                                                <SelectTrigger className="bg-black/20 border-white/10">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="TEXT">Text Input</SelectItem>
                                                                    <SelectItem value="NUMBER">Number Input</SelectItem>
                                                                    <SelectItem value="PRICE">Price (Currency)</SelectItem>
                                                                    <SelectItem value="RICHTEXT">Rich Text / Description</SelectItem>
                                                                    <SelectItem value="SELECT">Dropdown Select</SelectItem>
                                                                    <SelectItem value="MULTISELECT">Multi-Select</SelectItem>
                                                                    <SelectItem value="RADIO">Radio Buttons</SelectItem>
                                                                    <SelectItem value="CHECKBOX_GROUP">Checkbox Group</SelectItem>
                                                                    <SelectItem value="BOOLEAN">Single Switch/Checkbox</SelectItem>
                                                                    <SelectItem value="DATE">Date Picker</SelectItem>
                                                                    <SelectItem value="YEAR_RANGE">Year Range</SelectItem>
                                                                    <SelectItem value="COLOR">Color Picker</SelectItem>
                                                                    <SelectItem value="LOCATION">Map Location</SelectItem>
                                                                    <SelectItem value="MEDIA">Image/Video Upload</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs uppercase text-muted-foreground">Component</Label>
                                                            <Select
                                                                value={(field.component as string) || 'text'}
                                                                onValueChange={(value: any) => updateField(index, { component: value })}
                                                            >
                                                                <SelectTrigger className="bg-black/20 border-white/10">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="text">Text</SelectItem>
                                                                    <SelectItem value="number">Number</SelectItem>
                                                                    <SelectItem value="select">Select</SelectItem>
                                                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                                                    <SelectItem value="radio">Radio</SelectItem>
                                                                    <SelectItem value="textarea">Textarea</SelectItem>
                                                                    <SelectItem value="date">Date</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs uppercase text-muted-foreground">Data Source</Label>
                                                            <Select
                                                                value={(field.dataSource as string) || 'static'}
                                                                onValueChange={(value: any) => updateField(index, { dataSource: value })}
                                                            >
                                                                <SelectTrigger className="bg-black/20 border-white/10">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="static">Static</SelectItem>
                                                                    <SelectItem value="api">API</SelectItem>
                                                                    <SelectItem value="db">DB</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs uppercase text-muted-foreground">Placeholder</Label>
                                                            <Input
                                                                value={(field.placeholder as string) || ''}
                                                                onChange={(event) => updateField(index, { placeholder: event.target.value })}
                                                                className="bg-black/20 border-white/10"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="rounded-lg border border-white/10 bg-black/20">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleAdvancedField(index)}
                                                            className="w-full flex items-center justify-between px-3 py-2 text-left"
                                                        >
                                                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                                                Advanced Settings
                                                            </span>
                                                            <ChevronDown
                                                                className={`h-4 w-4 text-muted-foreground transition-transform ${
                                                                    isAdvancedCollapsed ? '-rotate-90' : 'rotate-0'
                                                                }`}
                                                            />
                                                        </button>
                                                        <div
                                                            className={`overflow-hidden transition-all duration-300 ease-out ${
                                                                isAdvancedCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2200px] opacity-100'
                                                            }`}
                                                        >
                                                            <div className="space-y-4 px-3 pb-3 border-t border-white/10 pt-3">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs uppercase text-muted-foreground">Depends On</Label>
                                                                        <div className="rounded-lg border border-white/10 p-2 max-h-28 overflow-y-auto">
                                                                            {fields
                                                                                .map((candidate, candidateIndex) => ({
                                                                                    key: candidate.key,
                                                                                    label: candidate.label,
                                                                                    candidateIndex,
                                                                                }))
                                                                                .filter((candidate) => candidate.candidateIndex !== index && candidate.key)
                                                                                .map((candidate) => {
                                                                                    const dependsOn = (field.dependsOn as string[]) || [];
                                                                                    const checked = dependsOn.includes(candidate.key as string);
                                                                                    return (
                                                                                        <label
                                                                                            key={`${index}-${candidate.key}`}
                                                                                            className="flex items-center gap-2 text-xs text-white/90 py-0.5"
                                                                                        >
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={checked}
                                                                                                onChange={(event) => {
                                                                                                    const next = new Set(dependsOn);
                                                                                                    if (event.target.checked) next.add(candidate.key as string);
                                                                                                    else next.delete(candidate.key as string);
                                                                                                    updateField(index, { dependsOn: Array.from(next) });
                                                                                                }}
                                                                                            />
                                                                                            <span>{candidate.label || candidate.key}</span>
                                                                                        </label>
                                                                                    );
                                                                                })}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs uppercase text-muted-foreground">Reset On Change</Label>
                                                                        <div className="rounded-lg border border-white/10 p-2 max-h-28 overflow-y-auto">
                                                                            {fields
                                                                                .map((candidate, candidateIndex) => ({
                                                                                    key: candidate.key,
                                                                                    label: candidate.label,
                                                                                    candidateIndex,
                                                                                }))
                                                                                .filter((candidate) => candidate.candidateIndex !== index && candidate.key)
                                                                                .map((candidate) => {
                                                                                    const resetOnChange = (field.resetOnChange as string[]) || [];
                                                                                    const checked = resetOnChange.includes(candidate.key as string);
                                                                                    return (
                                                                                        <label
                                                                                            key={`reset-${index}-${candidate.key}`}
                                                                                            className="flex items-center gap-2 text-xs text-white/90 py-0.5"
                                                                                        >
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={checked}
                                                                                                onChange={(event) => {
                                                                                                    const next = new Set(resetOnChange);
                                                                                                    if (event.target.checked) next.add(candidate.key as string);
                                                                                                    else next.delete(candidate.key as string);
                                                                                                    updateField(index, { resetOnChange: Array.from(next) });
                                                                                                }}
                                                                                            />
                                                                                            <span>{candidate.label || candidate.key}</span>
                                                                                        </label>
                                                                                    );
                                                                                })}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {(field.dataSource === 'api' || field.dataSource === 'db') ? (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs uppercase text-muted-foreground">Options Endpoint (API)</Label>
                                                                            <Input
                                                                                value={(field.optionsEndpoint as string) || ''}
                                                                                onChange={(event) => updateField(index, { optionsEndpoint: event.target.value })}
                                                                                placeholder="/options/models"
                                                                                className="bg-black/20 border-white/10"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs uppercase text-muted-foreground">Options Query (JSON)</Label>
                                                                            <Input
                                                                                value={field.optionsQuery ? JSON.stringify(field.optionsQuery) : ''}
                                                                                onChange={(event) => {
                                                                                    try {
                                                                                        const value = event.target.value.trim();
                                                                                        updateField(index, {
                                                                                            optionsQuery: value ? JSON.parse(value) : undefined,
                                                                                        });
                                                                                    } catch {
                                                                                        // keep current value if json is invalid during typing
                                                                                    }
                                                                                }}
                                                                                placeholder='{"type":"modelsByBrand"}'
                                                                                className="bg-black/20 border-white/10"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ) : null}

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs uppercase text-muted-foreground">VisibleIf (JSON RuleTree)</Label>
                                                                        <textarea
                                                                            value={field.visibleIf ? JSON.stringify(field.visibleIf) : ''}
                                                                            onChange={(event) => {
                                                                                try {
                                                                                    const value = event.target.value.trim();
                                                                                    updateField(index, {
                                                                                        visibleIf: value ? JSON.parse(value) : undefined,
                                                                                    });
                                                                                } catch {
                                                                                    // noop for invalid json while typing
                                                                                }
                                                                            }}
                                                                            rows={3}
                                                                            className="w-full rounded-md bg-black/20 border border-white/10 p-2 text-xs"
                                                                            placeholder='{} = always visible'
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs uppercase text-muted-foreground">RequiredIf (JSON RuleTree)</Label>
                                                                        <textarea
                                                                            value={field.requiredIf ? JSON.stringify(field.requiredIf) : ''}
                                                                            onChange={(event) => {
                                                                                try {
                                                                                    const value = event.target.value.trim();
                                                                                    updateField(index, {
                                                                                        requiredIf: value ? JSON.parse(value) : undefined,
                                                                                    });
                                                                                } catch {
                                                                                    // noop for invalid json while typing
                                                                                }
                                                                            }}
                                                                            rows={3}
                                                                            className="w-full rounded-md bg-black/20 border border-white/10 p-2 text-xs"
                                                                            placeholder='{} = not conditionally required'
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX_GROUP', 'COLOR'].includes(field.type || '') && (
                                                        <div className="bg-black/20 p-4 rounded-lg space-y-3 border border-white/5">
                                                            <div className="flex justify-between items-center">
                                                                <Label className="text-xs uppercase text-blue-400">
                                                                    {field.type === 'COLOR' ? 'Color Options' : 'Options Configuration'}
                                                                </Label>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => addOption(index)}
                                                                    className="h-6 text-xs hover:text-blue-400"
                                                                >
                                                                    <Plus className="w-3 h-3 mr-1" /> Add Option
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {field.options?.map((option, optIndex) => (
                                                                    <div key={optIndex} className="flex gap-2 items-center">
                                                                        {field.type === 'COLOR' ? (
                                                                            <input
                                                                                type="color"
                                                                                value={option.value}
                                                                                onChange={(event) => updateOption(index, optIndex, 'value', event.target.value)}
                                                                                className="h-8 w-12 bg-transparent border-none cursor-pointer"
                                                                            />
                                                                        ) : null}

                                                                        <Input
                                                                            value={option.label}
                                                                            onChange={(event) => updateOption(index, optIndex, 'label', event.target.value)}
                                                                            placeholder="Label"
                                                                            className="h-8 text-sm bg-black/20 border-white/10"
                                                                        />
                                                                        <Input
                                                                            value={option.value}
                                                                            onChange={(event) => updateOption(index, optIndex, 'value', event.target.value)}
                                                                            placeholder="Value"
                                                                            className="h-8 text-sm bg-black/20 border-white/10 font-mono text-xs"
                                                                        />
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-8 w-8 text-muted-foreground hover:text-red-400"
                                                                            onClick={() => {
                                                                                const newOptions = [...(field.options || [])];
                                                                                newOptions.splice(optIndex, 1);
                                                                                updateField(index, { options: newOptions });
                                                                            }}
                                                                        >
                                                                            <Trash className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                                {(!field.options || field.options.length === 0) && (
                                                                    <div className="text-xs text-muted-foreground text-center py-2">
                                                                        No options defined.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center pt-2 border-t border-white/5">
                                                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none text-muted-foreground hover:text-white transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={Boolean(field.isRequired)}
                                                                onChange={(event) => updateField(index, { isRequired: event.target.checked })}
                                                                className="w-4 h-4 rounded border-white/20 bg-black/20 text-blue-500 focus:ring-blue-500/20"
                                                            />
                                                            Required Field
                                                        </label>
                                                    </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                <Button
                                    onClick={() => addField(section)}
                                    variant="outline"
                                    className="w-full py-4 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 text-muted-foreground hover:text-blue-400 transition-all"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Field to {section}
                                </Button>
                            </div>
                        </div>
                    );
                    })}

                    <div className="flex justify-center pt-8">
                        <div className="text-center">
                            <p className="text-muted-foreground mb-4">Need more organization?</p>
                            <Button onClick={addSection} variant="secondary">
                                <Plus className="w-4 h-4 mr-2" /> Add Another Section
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
