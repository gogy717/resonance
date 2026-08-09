"use client"

import { AudioLines, AudioWaveform, Clock} from "lucide-react";

export function SettingsPanelHistory () {
    return (
        <div className="flex flex-1 flex-col h-full items-center justify-center gap-2 px-8 ">
            <div className="relative flex w-25 items-center justify-center">
                <div className="relative left-0 -rotate-30 rounded-full bg-muted p-3">
                    <AudioLines className="size-4 text-muted-foreground" />
                </div>
                <div className="relative z-10 rounded-full bg-foreground p-3">
                    <AudioWaveform className="size-4 text-background" />
                </div>
                <div className="relative right-0 rotate-30 rounded-full bg-muted p-3">
                    <Clock className="size-4 text-muted-foreground" />
                </div>

            </div>
            <div className="flex justify-center items-center flex-col">
                <p className="font-semibold tracking-tight text-foreground">
                    No generations yet...
                </p>
                <p className="max-w-48 text-center text-xs text-muted-foreground">
                    Generate some audio and it will appear here.
                </p>
            </div>
        </div>


    );
};
