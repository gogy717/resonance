import { AudioLines, BookOpen, Sparkles, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function VoicePreviewPlaceholder () {
    return (
        <div className="hidden h-full flex-1 flex-col items-center justify-center gap-6 border-t lg:flex">
            <div className="flex flex-col items-center gap-3">
                <div className="relative flex w-32 items-center justify-center">
                    {/* left side ui */}
                    <div className="absolute left-0 -rotate-30 rounded-full bg-muted p-4">
                        <Volume2 className="size-5 text-muted-foreground" />
                    </div>
                    {/* mid  ui */}
                    <div className="relative z-10 rounded-full bg-foreground p-4">
                        <Sparkles className="size-5 text-background" />
                    </div>
                    {/* right side ui */}
                    <div className="absolute right-0 rotate-30 rounded-full bg-muted p-4">
                        <AudioLines className="size-5 text-muted-foreground" />
                    </div>
                </div>
                <p className="text-lg font-semibold tracking-tight text-foreground">
                    Your audio preview will appear here
                </p>
                <p className="max-w-64 text-center text-sm text-muted-foreground">
                    Enter some text, choose a voice, and generate speech to preview the result.
                </p>

            </div>
            {/* Help button */}
            <Button variant="outline" size="sm" asChild>
                <a href="mailto:your-email@example.com">
                    <BookOpen />
                    Don&apos;t know how?
                </a>
            </Button>
        </div>
    );
}


