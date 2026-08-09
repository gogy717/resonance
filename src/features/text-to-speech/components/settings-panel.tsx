"use client"
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs"
import {SettingsPanelSettings} from "@/features/text-to-speech/components/settings-panel-settings";
import {SettingsPanelHistory} from "@/features/text-to-speech/components/settings-panel-history";

export function SettingsPanel() {
    const tabTriggerClassName =
        "flex-1 h-full gap-2 bg-transparent rounded-none border-x-0 border-t-0 border-b-px border-b-transparent shadow-none data-[state=active]:border-b-foreground group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none";
    return (
        <div className="hidden w-105 min-h-0 flex-1 flex-col border-l lg:flex">
            <Tabs defaultValue="settings" className="flex h-full min-h-0 gap-y-0">
                <TabsList className="w-full bg-transparent rounded-none border-b h-12 group-data-[orientation=horizontal]/tabs:h-12 p-0">
                    <TabsTrigger value="settings" className={tabTriggerClassName}>Settings</TabsTrigger>
                    <TabsTrigger value="history" className={tabTriggerClassName}>History</TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="mt-0 flex min-h-0 flex-1 flex-col">
                    <SettingsPanelSettings />
                </TabsContent>

                <TabsContent value="history" className="flex min-h-0 flex-1 flex-col h-full">
                    <SettingsPanelHistory />
                </TabsContent>
            </Tabs>
        </div>
    );
}