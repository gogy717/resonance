"use client";

import { useState } from "react";
import { Play, Square } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface Voice {
    id: string;
    name: string;
    description: string;
}

export function VoiceCard({ voice }: { voice: Voice }) {
    const [playing, setPlaying] = useState(false);

    const togglePlay = () => {
        setPlaying((prev) => !prev);
        if (!playing) toast.info(`Previewing "${voice.name}" (demo)`);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <CardTitle>{voice.name}</CardTitle>
                    <Button
                        size="icon-sm"
                        variant={playing ? "default" : "outline"}
                        aria-label={playing ? "Stop preview" : "Play preview"}
                        onClick={togglePlay}
                    >
                        {playing ? <Square /> : <Play />}
                    </Button>
                </div>
                <CardDescription>{voice.description}</CardDescription>
            </CardHeader>
        </Card>
    );
}
