import { Settings } from "lucide-react";

export function SettingsPanel() {
    return (
        <aside className="hidden min-h-0 w-105 shrink-0 flex-col border-l lg:flex">
            {/* Header */}
            <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                <Settings className="size-4" />

                <span className="text-sm font-medium">
          Settings
        </span>
            </div>

            {/* Content */}
            <div className="flex flex-1 items-center justify-center p-4">
                <p className="text-sm text-muted-foreground">
                    Voice settings will appear here
                </p>
            </div>
        </aside>
    );
}