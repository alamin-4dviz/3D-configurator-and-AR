import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Plus, X, ChevronRight, ChevronLeft, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  visible: z.boolean().default(true),
  parts: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

interface ModelUploadFormProps {
  onSubmit: (data: FormData, modelFile: File | null, textureFiles: File[]) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<FormData>;
  mode?: "create" | "edit";
}

const categories = [
  "Furniture",
  "Electronics",
  "Fashion",
  "Automotive",
  "Architecture",
  "Art",
  "Sports",
  "General",
];

const steps = [
  { id: 1, title: "Basic Info" },
  { id: 2, title: "Model Upload" },
  { id: 3, title: "Configurator Assets" },
  { id: 4, title: "Review & Publish" },
];

export function ModelUploadForm({
  onSubmit,
  isLoading = false,
  initialData,
  mode = "create",
}: ModelUploadFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [textureFiles, setTextureFiles] = useState<File[]>([]);
  const [newPart, setNewPart] = useState("");
  const [newColor, setNewColor] = useState("#000000");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || "General",
      visible: initialData?.visible ?? true,
      parts: initialData?.parts || [],
      colors: initialData?.colors || [],
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data, modelFile, textureFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setModelFile(file);
    }
  };

  const handleTextureAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setTextureFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeTexture = (index: number) => {
    setTextureFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addPart = () => {
    if (newPart.trim()) {
      const currentParts = form.getValues("parts") || [];
      form.setValue("parts", [...currentParts, newPart.trim()]);
      setNewPart("");
    }
  };

  const removePart = (index: number) => {
    const currentParts = form.getValues("parts") || [];
    form.setValue(
      "parts",
      currentParts.filter((_, i) => i !== index)
    );
  };

  const addColor = () => {
    if (newColor) {
      const currentColors = form.getValues("colors") || [];
      if (!currentColors.includes(newColor)) {
        form.setValue("colors", [...currentColors, newColor]);
      }
    }
  };

  const removeColor = (index: number) => {
    const currentColors = form.getValues("colors") || [];
    form.setValue(
      "colors",
      currentColors.filter((_, i) => i !== index)
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return form.getValues("title") && form.getValues("category");
      case 2:
        return mode === "edit" || modelFile !== null;
      case 3:
        return true;
      default:
        return true;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold transition-colors",
                  currentStep >= step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {step.id}
              </div>
              <span
                className={cn(
                  "ml-3 text-sm font-medium hidden sm:block",
                  currentStep >= step.id
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mx-4",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter model title"
                        {...field}
                        data-testid="input-model-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter model description"
                        rows={4}
                        {...field}
                        data-testid="input-model-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Upload 3D Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                  modelFile
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary/50"
                )}
              >
                {modelFile ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{modelFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(modelFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setModelFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".glb,.gltf,.obj,.fbx,.stl"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-model-file"
                    />
                    <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      GLB, GLTF, OBJ, FBX, or STL
                    </p>
                  </label>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Configurator Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-4">
                <AccordionItem value="parts">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex items-center gap-2">
                      Parts
                      <Badge variant="secondary" className="ml-2">
                        {form.watch("parts")?.length || 0}
                      </Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add part name (e.g., body, wheels)"
                          value={newPart}
                          onChange={(e) => setNewPart(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addPart())
                          }
                          data-testid="input-new-part"
                        />
                        <Button type="button" onClick={addPart} size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {form.watch("parts")?.map((part, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {part}
                            <button
                              type="button"
                              onClick={() => removePart(index)}
                              className="ml-1 h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="colors">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex items-center gap-2">
                      Colors
                      <Badge variant="secondary" className="ml-2">
                        {form.watch("colors")?.length || 0}
                      </Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          className="w-16 h-10 p-1"
                          data-testid="input-new-color"
                        />
                        <Button type="button" onClick={addColor} size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {form.watch("colors")?.map((color, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-muted rounded-full pl-1 pr-2 py-1"
                          >
                            <div
                              className="h-6 w-6 rounded-full border"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-mono">{color}</span>
                            <button
                              type="button"
                              onClick={() => removeColor(index)}
                              className="ml-1 h-4 w-4 rounded-full hover:bg-background flex items-center justify-center"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="textures">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex items-center gap-2">
                      Textures
                      <Badge variant="secondary" className="ml-2">
                        {textureFiles.length}
                      </Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleTextureAdd}
                          className="hidden"
                          data-testid="input-texture-files"
                        />
                        <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                          <Plus className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Add texture files
                          </p>
                        </div>
                      </label>
                      {textureFiles.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {textureFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                            >
                              <span className="text-sm truncate flex-1">
                                {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeTexture(index)}
                                className="h-5 w-5 rounded-full hover:bg-background flex items-center justify-center"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Title</Label>
                    <p className="font-medium">{form.getValues("title")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium">{form.getValues("category")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="text-sm">
                      {form.getValues("description") || "No description"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Model File</Label>
                    <p className="font-medium">
                      {modelFile?.name || "No file selected"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Parts</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(form.getValues("parts") || []).length > 0 ? (
                        form.getValues("parts")?.map((part, i) => (
                          <Badge key={i} variant="secondary">
                            {part}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No parts defined
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Colors</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(form.getValues("colors") || []).length > 0 ? (
                        form.getValues("colors")?.map((color, i) => (
                          <div
                            key={i}
                            className="h-6 w-6 rounded-full border"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No colors defined
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Textures</Label>
                    <p className="text-sm">
                      {textureFiles.length} texture file(s)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <FormField
                  control={form.control}
                  name="visible"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-visibility"
                        />
                      </FormControl>
                      <div>
                        <FormLabel className="text-base">
                          Make visible to users
                        </FormLabel>
                        <FormDescription>
                          {field.value
                            ? "Model will be publicly visible"
                            : "Model will be hidden from public"}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            data-testid="button-previous-step"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
              disabled={!canProceed()}
              data-testid="button-next-step"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading} data-testid="button-submit-model">
              {isLoading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "create" ? "Publish Model" : "Save Changes"}
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
