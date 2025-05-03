import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertConfigPropertySchema, PropertyTypeEnum } from "@shared/schema";
import { useServiceConfig } from "@/hooks/use-service-config";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Edit, Plus, Trash } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Extend the config property schema for the form with additional validation
const configPropertyFormSchema = insertConfigPropertySchema
  .omit({ serviceId: true })
  .extend({
    // Make sure the key is at least 2 characters and follows a valid pattern
    key: z.string().min(2, {
      message: "Key must be at least 2 characters",
    }),
    // Add additional validation for value field based on the type
    value: z.string().min(1, {
      message: "Value is required",
    }),
  });

type ConfigPropertyFormValues = z.infer<typeof configPropertyFormSchema>;

interface ConfigManagerProps {
  serviceId: number | string;
}

export function ConfigManager({ serviceId }: ConfigManagerProps) {
  const {
    configProperties,
    isLoading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
    isCreating,
    isUpdating,
    isDeleting,
  } = useServiceConfig(serviceId);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<null | number>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Create form
  const createForm = useForm<ConfigPropertyFormValues>({
    resolver: zodResolver(configPropertyFormSchema),
    defaultValues: {
      key: "",
      value: "",
      type: "STRING",
      description: "",
      source: "application.properties",
      isActive: true,
    },
  });

  // Edit form
  const editForm = useForm<ConfigPropertyFormValues>({
    resolver: zodResolver(configPropertyFormSchema),
    defaultValues: {
      key: "",
      value: "",
      type: "STRING",
      description: "",
      source: "application.properties",
      isActive: true,
    },
  });

  // Handle create form submission
  function onCreateSubmit(data: ConfigPropertyFormValues) {
    createProperty(data, {
      onSuccess: () => {
        createForm.reset();
        setIsCreateDialogOpen(false);
      },
    });
  }

  // Handle edit form submission
  function onEditSubmit(data: ConfigPropertyFormValues) {
    if (editingProperty !== null) {
      updateProperty(
        {
          id: editingProperty,
          data,
        },
        {
          onSuccess: () => {
            editForm.reset();
            setIsEditDialogOpen(false);
            setEditingProperty(null);
          },
        }
      );
    }
  }

  // Set up the edit form when a property is selected for editing
  function handleEdit(propertyId: number) {
    const property = configProperties.find((p) => p.id === propertyId);
    if (property) {
      editForm.reset({
        key: property.key,
        value: property.value,
        type: property.type,
        description: property.description || "",
        source: property.source,
        isActive: property.isActive,
      });
      setEditingProperty(propertyId);
      setIsEditDialogOpen(true);
    }
  }

  // Handle property deletion
  function handleDelete(propertyId: number) {
    if (window.confirm("Are you sure you want to delete this property?")) {
      deleteProperty(propertyId);
    }
  }

  // Filter properties based on active tab
  const filteredProperties = configProperties.filter((prop) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return prop.isActive;
    if (activeTab === "inactive") return !prop.isActive;
    return true;
  });

  // Group properties by source
  const groupedProperties = filteredProperties.reduce((acc, prop) => {
    const source = prop.source;
    if (!acc[source]) {
      acc[source] = [];
    }
    acc[source].push(prop);
    return acc;
  }, {} as Record<string, typeof configProperties>);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuration Properties</CardTitle>
          <CardDescription>Loading configuration properties...</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Skeleton loader */}
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted h-12 rounded-md animate-pulse"
              ></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuration Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load configuration properties. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Configuration Properties</CardTitle>
          <CardDescription>
            Manage application configuration properties
          </CardDescription>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Configuration Property</DialogTitle>
              <DialogDescription>
                Create a new configuration property for this service.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(onCreateSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <Input placeholder="server.port" {...field} />
                      </FormControl>
                      <FormDescription>
                        Configuration property key (e.g. spring.datasource.url)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Property value"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The value for this configuration property
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PropertyTypeEnum.options.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="application.properties"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Whether this property is active and applied to the
                          service
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Property"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Configuration Property</DialogTitle>
              <DialogDescription>
                Update the configuration property for this service.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={editForm.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <Input placeholder="server.port" {...field} />
                      </FormControl>
                      <FormDescription>
                        Configuration property key (e.g. spring.datasource.url)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Property value"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The value for this configuration property
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PropertyTypeEnum.options.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="application.properties"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Whether this property is active and applied to the
                          service
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Updating..." : "Update Property"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredProperties.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground">
                  No configuration properties found. Click "Add Property" to create one.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-320px)] pr-4">
                {Object.entries(groupedProperties).map(([source, props]) => (
                  <div key={source} className="mb-6">
                    <h3 className="mb-2 font-semibold text-sm">{source}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Key</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {props.map((property) => (
                          <TableRow key={property.id}>
                            <TableCell className="font-medium">
                              {property.key}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {property.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {property.value}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  property.isActive ? "default" : "secondary"
                                }
                              >
                                {property.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(property.id)}
                                  disabled={isUpdating || isDeleting}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(property.id)}
                                  disabled={isDeleting}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}