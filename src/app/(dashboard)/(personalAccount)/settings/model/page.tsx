'use client';

import React, { useState, useEffect } from 'react';
import { Bot, AlertTriangle, Check, ChevronDown, Crown, Search, Plus, Edit, Trash, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isLocalMode } from '@/lib/config';
import {
  useModelSelection,
  MODELS,
  STORAGE_KEY_CUSTOM_MODELS,
  STORAGE_KEY_MODEL,
  DEFAULT_FREE_MODEL_ID,
  DEFAULT_PREMIUM_MODEL_ID,
  formatModelName,
} from '@/components/thread/chat-input/_use-model-selection';
import { CustomModelDialog, CustomModelFormData } from '@/components/thread/chat-input/custom-model-dialog';
import { PaywallDialog } from '@/components/payment/paywall-dialog';
import { BillingModal } from '@/components/billing/billing-modal';

interface CustomModel {
  id: string;
  label: string;
}

export default function ModelSettingsPage() {
  const {
    selectedModel,
    setSelectedModel,
    allModels,
    customModels: hookCustomModels,
    subscriptionStatus,
    canAccessModel,
    refreshCustomModels,
  } = useModelSelection();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [lockedModel, setLockedModel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Custom models state - sync with hook's customModels
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [isCustomModelDialogOpen, setIsCustomModelDialogOpen] = useState(false);
  const [dialogInitialData, setDialogInitialData] = useState<CustomModelFormData>({ id: '', label: '' });
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  // Initialize custom models from hook on mount
  useEffect(() => {
    if (isLocalMode()) {
      setCustomModels(hookCustomModels);
    }
    setIsLoading(false);
  }, [hookCustomModels]);

  // Filter models based on search query - allModels from hook is already pre-sorted
  const filteredOptions = allModels.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opt.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLabel = allModels.find((o) => o.id === selectedModel)?.label || 'Select model';

  const handleSelect = (id: string) => {
    const isCustomModel = customModels.some(model => model.id === id);

    if (isCustomModel && isLocalMode()) {
      setSelectedModel(id);
      setIsDropdownOpen(false);
      toast.success(`Model changed to ${allModels.find(m => m.id === id)?.label || id}`);
      return;
    }

    if (canAccessModel(id)) {
      setSelectedModel(id);
      setIsDropdownOpen(false);
      toast.success(`Model changed to ${allModels.find(m => m.id === id)?.label || id}`);
    } else {
      setLockedModel(id);
      setPaywallOpen(true);
    }
  };

  const handleUpgradeClick = () => {
    setBillingModalOpen(true);
  };

  const closePaywall = () => {
    setPaywallOpen(false);
    setLockedModel(null);
  };

  // Custom model dialog handlers
  const openAddCustomModelDialog = () => {
    setDialogInitialData({ id: '', label: '' });
    setDialogMode('add');
    setIsCustomModelDialogOpen(true);
  };

  const openEditCustomModelDialog = (model: CustomModel) => {
    setDialogInitialData({ id: model.id, label: model.label });
    setEditingModelId(model.id);
    setDialogMode('edit');
    setIsCustomModelDialogOpen(true);
  };

  const handleSaveCustomModel = (formData: CustomModelFormData) => {
    const modelId = formData.id.trim();
    const displayId = modelId.startsWith('openrouter/') ? modelId.replace('openrouter/', '') : modelId;
    const modelLabel = formData.label.trim() || formatModelName(displayId);

    if (!modelId) return;

    if (customModels.some(model =>
      model.id === modelId && (dialogMode === 'add' || model.id !== editingModelId))) {
      toast.error('A model with this ID already exists');
      return;
    }

    closeCustomModelDialog();

    const newModel = { id: modelId, label: modelLabel };
    const updatedModels = dialogMode === 'add'
      ? [...customModels, newModel]
      : customModels.map(model => model.id === editingModelId ? newModel : model);

    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_MODELS, JSON.stringify(updatedModels));
    } catch (error) {
      console.error('Failed to save custom models to localStorage:', error);
      toast.error('Failed to save custom model');
      return;
    }

    setCustomModels(updatedModels);

    if (refreshCustomModels) {
      refreshCustomModels();
    }

    if (dialogMode === 'add') {
      setSelectedModel(modelId);
      try {
        localStorage.setItem(STORAGE_KEY_MODEL, modelId);
      } catch (error) {
        console.warn('Failed to save selected model to localStorage:', error);
      }
      toast.success(`Custom model "${modelLabel}" added and selected`);
    } else {
      if (selectedModel === editingModelId) {
        setSelectedModel(modelId);
        try {
          localStorage.setItem(STORAGE_KEY_MODEL, modelId);
        } catch (error) {
          console.warn('Failed to save selected model to localStorage:', error);
        }
      }
      toast.success(`Custom model "${modelLabel}" updated`);
    }
  };

  const closeCustomModelDialog = () => {
    setIsCustomModelDialogOpen(false);
    setDialogInitialData({ id: '', label: '' });
    setEditingModelId(null);
  };

  const handleDeleteCustomModel = (modelId: string) => {
    const modelToDelete = customModels.find(m => m.id === modelId);
    const updatedCustomModels = customModels.filter(model => model.id !== modelId);

    if (isLocalMode() && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_MODELS, JSON.stringify(updatedCustomModels));
      } catch (error) {
        console.error('Failed to update custom models in localStorage:', error);
        toast.error('Failed to delete custom model');
        return;
      }
    }

    setCustomModels(updatedCustomModels);

    if (refreshCustomModels) {
      refreshCustomModels();
    }

    if (selectedModel === modelId) {
      const defaultModel = isLocalMode() ? DEFAULT_PREMIUM_MODEL_ID : DEFAULT_FREE_MODEL_ID;
      setSelectedModel(defaultModel);
      try {
        localStorage.setItem(STORAGE_KEY_MODEL, defaultModel);
      } catch (error) {
        console.warn('Failed to update selected model in localStorage:', error);
      }
    }

    toast.success(`Custom model "${modelToDelete?.label || modelId}" deleted`);
  };

  const renderModelOption = (model: any, index: number) => {
    const isCustom = Boolean(model.isCustom) ||
      (isLocalMode() && customModels.some(m => m.id === model.id));

    const accessible = isCustom ? true : canAccessModel(model.id);
    const isHighlighted = index === highlightedIndex;
    const isPremium = model.requiresSubscription;
    const isLowQuality = MODELS[model.id]?.lowQuality || false;
    const isRecommended = MODELS[model.id]?.recommended || false;

    return (
      <DropdownMenuItem
        key={model.id}
        className={cn(
          "text-sm px-3 py-2 flex items-center justify-between cursor-pointer",
          isHighlighted && "bg-accent",
          !accessible && "opacity-70"
        )}
        onClick={() => handleSelect(model.id)}
        onMouseEnter={() => setHighlightedIndex(index)}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{model.label}</span>
          {isLowQuality && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>Not recommended for complex tasks</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isRecommended && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
              Recommended
            </Badge>
          )}
          {isCustom && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              Custom
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isPremium && !accessible && (
            <Crown className="h-3.5 w-3.5 text-blue-500" />
          )}
          {isLocalMode() && isCustom && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditCustomModelDialog(model);
                }}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCustomModel(model.id);
                }}
                className="text-muted-foreground hover:text-red-500 p-1"
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {selectedModel === model.id && (
            <Check className="h-4 w-4 text-blue-500" />
          )}
        </div>
      </DropdownMenuItem>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Model Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your preferred AI model for conversations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5" />
            AI Model Selection
          </CardTitle>
          <CardDescription>
            Choose the AI model that best fits your needs. Premium models offer enhanced capabilities and better performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Current Model</label>
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto justify-between min-w-[200px]"
                  >
                    <div className="flex items-center gap-2">
                      {MODELS[selectedModel]?.lowQuality && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="truncate">{selectedLabel}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-80 p-0">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs font-medium text-muted-foreground">All Models</span>
                      {isLocalMode() && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openAddCustomModelDialog();
                                }}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add a custom model</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {filteredOptions.map((model, index) => renderModelOption(model, index))}
                    {filteredOptions.length === 0 && (
                      <div className="text-sm text-center py-4 text-muted-foreground">
                        No models match your search
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {!isLocalMode() && subscriptionStatus === 'no_subscription' && (
              <Button onClick={handleUpgradeClick} variant="default">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade for Premium Models
              </Button>
            )}
          </div>

          {/* Model Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {isLocalMode() ? (
                <>
                  You&apos;re running in local mode. You can add custom models from{' '}
                  <a 
                    href="https://openrouter.ai/models" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    OpenRouter
                  </a>{' '}
                  by prefixing them with <code className="bg-muted px-1 rounded">openrouter/</code>.
                </>
              ) : (
                <>
                  Your selected model will be used for all new conversations. Premium models provide 
                  better reasoning, accuracy, and capabilities for complex tasks.
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* Custom Models Section - Only in Local Mode */}
          {isLocalMode() && customModels.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Custom Models</h4>
              <div className="space-y-2">
                {customModels.map((model) => (
                  <div
                    key={model.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-md border",
                      selectedModel === model.id && "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{model.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{model.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedModel === model.id && (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSelect(model.id)}
                        disabled={selectedModel === model.id}
                      >
                        {selectedModel === model.id ? 'Selected' : 'Select'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditCustomModelDialog(model)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCustomModel(model.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Custom Model Button - Only in Local Mode */}
          {isLocalMode() && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={openAddCustomModelDialog}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Model
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Model Dialog */}
      <CustomModelDialog
        isOpen={isCustomModelDialogOpen}
        onClose={closeCustomModelDialog}
        onSave={handleSaveCustomModel}
        initialData={dialogInitialData}
        mode={dialogMode}
      />

      {/* Billing Modal */}
      <BillingModal
        open={billingModalOpen}
        onOpenChange={setBillingModalOpen}
        returnUrl={typeof window !== 'undefined' ? window.location.href : '/'}
      />

      {/* Paywall Dialog */}
      {paywallOpen && (
        <PaywallDialog
          open={true}
          onDialogClose={closePaywall}
          title="Premium Model"
          description={
            lockedModel
              ? `Subscribe to access ${allModels.find((m) => m.id === lockedModel)?.label}`
              : 'Subscribe to access premium models with enhanced capabilities'
          }
          ctaText="Subscribe Now"
          cancelText="Maybe Later"
        />
      )}
    </div>
  );
}
