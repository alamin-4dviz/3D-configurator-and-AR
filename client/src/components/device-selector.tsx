import { Smartphone, Tablet, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeviceType } from "@shared/schema";

interface DeviceSelectorProps {
  selectedDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

interface DeviceOption {
  id: DeviceType;
  label: string;
  format: string;
  icon: typeof Smartphone;
  description: string;
}

const deviceOptions: DeviceOption[] = [
  {
    id: "ios",
    label: "iOS",
    format: "USDZ",
    icon: Smartphone,
    description: "Quick Look AR experience",
  },
  {
    id: "android",
    label: "Android / Others",
    format: "GLB",
    icon: Tablet,
    description: "WebXR AR experience",
  },
  {
    id: "both",
    label: "Both Platforms",
    format: "USDZ + GLB",
    icon: Layers,
    description: "Universal AR support",
  },
];

export function DeviceSelector({ selectedDevice, onDeviceChange }: DeviceSelectorProps) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4" data-testid="text-device-selection-title">
        Select Target Device
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {deviceOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedDevice === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => onDeviceChange(option.id)}
              data-testid={`button-device-${option.id}`}
              className={cn(
                "relative flex flex-col items-center justify-center p-6 min-h-32 rounded-lg border-2 transition-all",
                "hover-elevate active-elevate-2",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <Icon
                className={cn(
                  "h-8 w-8 mb-3",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "font-semibold text-base",
                  isSelected ? "text-primary" : "text-foreground"
                )}
              >
                {option.label}
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                {option.description}
              </span>
              <span
                className={cn(
                  "mt-3 px-3 py-1 rounded-full text-xs font-medium",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {option.format}
              </span>
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <svg
                      className="h-2.5 w-2.5 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
