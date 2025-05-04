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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Edit, Plus, Save, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define a Zod schema for form validation
const configPropertyFormSchema = z.object({
  key: z.string().min(1, "Property key is required"),
  value: z.string().min(1, "Property value is required"),
  type: PropertyTypeEnum,
  source: z.string().min(1, "Source file is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ConfigPropertyFormValues = z.infer<typeof configPropertyFormSchema>;

interface ConfigManagerProps {
  serviceId: number | string;
}

export function ConfigManager({ serviceId }: ConfigManagerProps) {
  const [editPropertyId, setEditPropertyId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const {
    configProperties,
    isLoading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
    isCreating,
    isUpdating,
    isDeleting
  } = useServiceConfig(serviceId);

  // Group properties by source file
  const propertiesBySource = configProperties.reduce((acc, property) => {
    const source = property.source;
    if (!acc[source]) {
      acc[source] = [];
    }
    acc[source].push(property);
    return acc;
  }, {} as Record<string, typeof configProperties>);

  // Form for creating new properties
  const createForm = useForm<ConfigPropertyFormValues>({
    resolver: zodResolver(configPropertyFormSchema),
    defaultValues: {
      key: "",
      value: "",
      type: "STRING",
      source: "application.properties",
      description: "",
      isActive: true
    }
  });

  // Form for editing properties
  const editForm = useForm<ConfigPropertyFormValues>({
    resolver: zodResolver(configPropertyFormSchema),
    defaultValues: {
      key: "",
      value: "",
      type: "STRING",
      source: "application.properties", 
      description: "",
      isActive: true
    }
  });

  function onCreateSubmit(data: ConfigPropertyFormValues) {
    createProperty({
      ...data,
      description: data.description || "",
    });
    setCreateDialogOpen(false);
    createForm.reset();
  }

  function onEditSubmit(data: ConfigPropertyFormValues) {
    if (editPropertyId) {
      updateProperty({
        id: editPropertyId,
        data: {
          ...data,
          description: data.description || "",
        }
      });
      setEditDialogOpen(false);
      setEditPropertyId(null);
      editForm.reset();
    }
  }

  function handleEdit(propertyId: number) {
    const property = configProperties.find(p => p.id === propertyId);
    if (property) {
      editForm.reset({
        key: property.key,
        value: property.value,
        type: property.type,
        source: property.source,
        description: property.description || "",
        isActive: property.isActive
      });
      setEditPropertyId(propertyId);
      setEditDialogOpen(true);
    }
  }

  function handleDelete(propertyId: number) {
    if (window.confirm("Are you sure you want to delete this property?")) {
      deleteProperty(propertyId);
    }
  }

  if (isLoading) {
    return <div className="py-4 text-center">Loading configuration properties...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load configuration properties. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Configuration Properties</h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span>Add Property</span>
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
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={createForm.control}
                    name="key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key</FormLabel>
                        <FormControl>
                          <Input placeholder="Property key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="STRING">String</SelectItem>
                            <SelectItem value="NUMBER">Number</SelectItem>
                            <SelectItem value="BOOLEAN">Boolean</SelectItem>
                            <SelectItem value="ARRAY">Array</SelectItem>
                            <SelectItem value="MAP">Map</SelectItem>
                            <SelectItem value="JSON">JSON</SelectItem>
                            <SelectItem value="YAML">YAML</SelectItem>
                          </SelectContent>
                        </Select>
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
                          value={field.value || ''}
                        />
                      </FormControl>
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
                        <Input placeholder="Source file" {...field} />
                      </FormControl>
                      <FormDescription>
                        The configuration file where this property is defined
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
                        <Textarea placeholder="Property value" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Property"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Property Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Configuration Property</DialogTitle>
            <DialogDescription>
              Update this configuration property.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={editForm.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <Input placeholder="Property key" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="STRING">String</SelectItem>
                          <SelectItem value="NUMBER">Number</SelectItem>
                          <SelectItem value="BOOLEAN">Boolean</SelectItem>
                          <SelectItem value="ARRAY">Array</SelectItem>
                          <SelectItem value="MAP">Map</SelectItem>
                          <SelectItem value="JSON">JSON</SelectItem>
                          <SelectItem value="YAML">YAML</SelectItem>
                        </SelectContent>
                      </Select>
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
                        value={field.value || ''}
                      />
                    </FormControl>
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
                      <Input placeholder="Source file" {...field} />
                    </FormControl>
                    <FormDescription>
                      The configuration file where this property is defined
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
                      <Textarea placeholder="Property value" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium">Active</FormLabel>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Property"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Display configuration properties */}
      {configProperties.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4 text-muted-foreground">
              No configuration properties found for this service.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(propertiesBySource).map(([source, properties]) => (
            <Card key={source}>
              <CardHeader className="pb-3">
                <CardTitle className="text-md">{source}</CardTitle>
                <CardDescription>
                  {properties.length} {properties.length === 1 ? 'property' : 'properties'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Key</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((property) => (
                        <TableRow key={property.id}>
                          <TableCell className="font-medium">
                            {property.key}
                            {property.description && (
                              <p className="text-xs text-muted-foreground mt-1">{property.description}</p>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {property.value.length > 100
                              ? property.value.substring(0, 100) + "..."
                              : property.value}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{property.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={property.isActive ? "default" : "secondary"}>
                              {property.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(property.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(property.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}