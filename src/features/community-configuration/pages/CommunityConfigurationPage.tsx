import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSocietySession } from "@/providers/SocietyProvider";
import {
  getCommunityConfiguration,
  updateCommunityConfiguration,
} from "@/services/community-configuration.service";
import { defaultTerminologyLabels } from "@/services/terminology.service";
import type { TerminologyLabels } from "@/types/community";

type TerminologyLabelKey = keyof TerminologyLabels;

interface ConfigFormState {
  displayName: string;
  logoUrl: string;
  primaryColor: string;
  timezone: string;
  locale: string;
  fiscalYearStartMonth: string;
  hierarchyDepth: string;
  usesFloors: boolean;
  labels: TerminologyLabels;
}

const terminologyFields: Array<{
  key: TerminologyLabelKey;
  label: string;
  helper: string;
}> = [
  {
    key: "community",
    label: "Community label",
    helper: "Primary name for the managed group.",
  },
  {
    key: "propertyGroup",
    label: "Primary grouping label",
    helper: "First level used for organizing residences.",
  },
  {
    key: "subGroup",
    label: "Secondary grouping label",
    helper: "Optional second level used inside the primary grouping.",
  },
  {
    key: "floor",
    label: "Level label",
    helper: "Vertical or sequence label when levels are enabled.",
  },
  {
    key: "unit",
    label: "Residence label",
    helper: "Individual home record label.",
  },
  {
    key: "resident",
    label: "Member label",
    helper: "Primary person label for people living in the community.",
  },
  {
    key: "owner",
    label: "Owner label",
    helper: "Ownership role label.",
  },
  {
    key: "tenant",
    label: "Tenant label",
    helper: "Occupancy role label.",
  },
  {
    key: "committee",
    label: "Committee label",
    helper: "Governance group label.",
  },
  {
    key: "parkingSpace",
    label: "Parking label",
    helper: "Parking allocation label.",
  },
  {
    key: "facility",
    label: "Facility label",
    helper: "Shared space label.",
  },
  {
    key: "amenity",
    label: "Amenity label",
    helper: "Service or convenience label.",
  },
];

function createEmptyForm(): ConfigFormState {
  return {
    displayName: "",
    logoUrl: "",
    primaryColor: "#1F6F5B",
    timezone: "Asia/Kolkata",
    locale: "en-IN",
    fiscalYearStartMonth: "4",
    hierarchyDepth: "1",
    usesFloors: true,
    labels: defaultTerminologyLabels,
  };
}

function parseInteger(value: string, fieldName: string, min: number, max: number): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}.`);
  }

  return parsed;
}

export function CommunityConfigurationPage() {
  const queryClient = useQueryClient();
  const { activeSocietyId, roleContext, refreshMemberships } = useSocietySession();
  const [form, setForm] = useState<ConfigFormState>(() => createEmptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canUpdate = roleContext?.can("communities.update") ?? false;

  const configurationQuery = useQuery({
    queryKey: ["communityConfiguration", activeSocietyId],
    queryFn: () => getCommunityConfiguration(activeSocietyId ?? ""),
    enabled: Boolean(activeSocietyId),
  });

  useEffect(() => {
    if (!configurationQuery.data) {
      return;
    }

    const { brandingConfig, communityConfig, terminologyConfig } =
      configurationQuery.data;

    setForm({
      displayName: brandingConfig.displayName,
      logoUrl: brandingConfig.logoUrl ?? "",
      primaryColor: brandingConfig.primaryColor ?? "#1F6F5B",
      timezone: communityConfig.timezone,
      locale: communityConfig.locale,
      fiscalYearStartMonth: String(communityConfig.fiscalYearStartMonth),
      hierarchyDepth: String(terminologyConfig.hierarchyDepth),
      usesFloors: terminologyConfig.usesFloors,
      labels: {
        ...defaultTerminologyLabels,
        ...terminologyConfig.labels,
      },
    });
  }, [configurationQuery.data]);

  const updateMutation = useMutation({
    mutationFn: updateCommunityConfiguration,
    onSuccess: async () => {
      setSuccessMessage("Configuration saved.");
      setFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["communityConfiguration", activeSocietyId],
        }),
        queryClient.invalidateQueries({ queryKey: ["terminology", activeSocietyId] }),
        refreshMemberships(),
      ]);
    },
  });

  const mutationError = useMemo(() => {
    if (updateMutation.error instanceof Error) {
      return updateMutation.error.message;
    }

    return null;
  }, [updateMutation.error]);

  function updateLabel(key: TerminologyLabelKey, value: string) {
    setForm((current) => ({
      ...current,
      labels: {
        ...current.labels,
        [key]: value,
      },
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    setFormError(null);

    if (!activeSocietyId) {
      setFormError("Select a community before saving configuration.");
      return;
    }

    if (!canUpdate) {
      setFormError("You do not have permission to update configuration.");
      return;
    }

    try {
      updateMutation.mutate({
        communityId: activeSocietyId,
        communityConfig: {
          timezone: form.timezone,
          locale: form.locale,
          fiscalYearStartMonth: parseInteger(
            form.fiscalYearStartMonth,
            "Fiscal year start month",
            1,
            12,
          ),
        },
        brandingConfig: {
          displayName: form.displayName,
          logoUrl: form.logoUrl,
          primaryColor: form.primaryColor,
        },
        terminologyConfig: {
          labels: form.labels,
          hierarchyDepth: parseInteger(form.hierarchyDepth, "Hierarchy depth", 1, 6),
          usesFloors: form.usesFloors,
        },
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Configuration is invalid.");
    }
  }

  if (!activeSocietyId) {
    return (
      <Alert>
        <AlertTitle>No community selected</AlertTitle>
        <AlertDescription>
          Select a community before managing configuration.
        </AlertDescription>
      </Alert>
    );
  }

  if (!canUpdate) {
    return (
      <Alert>
        <AlertTitle>Access restricted</AlertTitle>
        <AlertDescription>
          Your current role cannot update community configuration.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Administration</p>
        <h1 className="text-2xl font-semibold tracking-normal">Configuration</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Configure labels, identity, and operating defaults for the selected
          community.
        </p>
      </div>

      {configurationQuery.isLoading ? (
        <Alert>
          <AlertTitle>Loading configuration</AlertTitle>
          <AlertDescription>Fetching the latest community settings.</AlertDescription>
        </Alert>
      ) : null}

      {configurationQuery.error instanceof Error ? (
        <Alert className="border-destructive/40">
          <AlertTitle>Unable to load configuration</AlertTitle>
          <AlertDescription>{configurationQuery.error.message}</AlertDescription>
        </Alert>
      ) : null}

      {formError || mutationError ? (
        <Alert className="border-destructive/40">
          <AlertTitle>Save failed</AlertTitle>
          <AlertDescription>{formError ?? mutationError}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert className="border-primary/40">
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>
            Controls the name and visual markers used inside Sahavas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={form.displayName}
              maxLength={120}
              required
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayName: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary color</Label>
            <Input
              id="primaryColor"
              value={form.primaryColor}
              placeholder="#1F6F5B"
              pattern="^#[0-9A-Fa-f]{6}$"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  primaryColor: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={form.logoUrl}
              placeholder="https://example.com/logo.png"
              inputMode="url"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  logoUrl: event.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operating Defaults</CardTitle>
          <CardDescription>
            Controls locale, fiscal cycle, and residence hierarchy behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={form.timezone}
              required
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  timezone: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locale">Locale</Label>
            <Input
              id="locale"
              value={form.locale}
              required
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  locale: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fiscalYearStartMonth">Fiscal start month</Label>
            <Input
              id="fiscalYearStartMonth"
              type="number"
              min={1}
              max={12}
              value={form.fiscalYearStartMonth}
              required
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  fiscalYearStartMonth: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hierarchyDepth">Hierarchy depth</Label>
            <Input
              id="hierarchyDepth"
              type="number"
              min={1}
              max={6}
              value={form.hierarchyDepth}
              required
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hierarchyDepth: event.target.value,
                }))
              }
            />
          </div>
          <label className="flex items-start gap-3 rounded-md border border-border p-3 sm:col-span-2 lg:col-span-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              checked={form.usesFloors}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  usesFloors: event.target.checked,
                }))
              }
            />
            <span>
              <span className="block text-sm font-medium">Use levels in hierarchy</span>
              <span className="block text-sm text-muted-foreground">
                Enable when residences are organized by vertical or sequence levels.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Terminology</CardTitle>
          <CardDescription>
            Customize labels so Sahavas speaks the language of this community.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {terminologyFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`label-${field.key}`}>{field.label}</Label>
              <Input
                id={`label-${field.key}`}
                value={form.labels[field.key]}
                maxLength={40}
                required
                onChange={(event) => updateLabel(field.key, event.target.value)}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {field.helper}
              </p>
            </div>
          ))}
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending || configurationQuery.isLoading}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {updateMutation.isPending ? "Saving" : "Save configuration"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
