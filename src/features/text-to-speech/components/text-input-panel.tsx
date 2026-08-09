"use client"
import {GenerateButton} from "@/features/text-to-speech/components/generate-button";
import { Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

import { useStore } from "@tanstack/react-form";

import { useTypedAppFormContext } from "@/hooks/use-app-form";
import { ttsFormOptions } from "@/features/text-to-speech/components/text-to-speech-form";

import {COST_PER_UNIT, TEXT_MAX_LENGTH} from "@/features/text-to-speech/data/constants";

export function TextInputPanel() {
    const form = useTypedAppFormContext(ttsFormOptions);

    const text = useStore(
        form.store,
        (state) => state.values.text,
    );

    const isSubmitting = useStore(
        form.store,
        (state) => state.isSubmitting,
    );

    const isValid = useStore(
        form.store,
        (state) => state.isValid,
    );

    return (
        <div className={"flex h-full min-h-0 flex-col flex-1"}>
            <div className={"relative min-h-0 flex-1"}>
                <form.Field name="text">
                    {(field) => (
                        <Textarea
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder={"Start Typing"}
                            className={"absolute inset-0 resize-none border-0 bg-transparent p-4 pb-6 lg:p-6 lg:pb-8 " +
                                "text-base! leading-relaxed tracking-tight shadow-none wrap-break-word focus-visible:ring-0"}
                            maxLength={TEXT_MAX_LENGTH}
                            disabled={isSubmitting}
                        />
                    )}
                </form.Field>


                {/*Fade*/}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-background to-transparent" />
            </div>
            {/*ActionBar*/}
            <div className={"shrink-0 p-4 lg:p-6"}>
                {/* Mobile Layout */}
                <div className={"flex flex-col gap-3 lg:hidden"}>
                    <GenerateButton className="w-full" isSubmitting={isSubmitting} onSubmit={() => form.handleSubmit()} disabled={isSubmitting || !isValid}/>
                </div>
                {/* Desktop Layout */}
                {text.length > 0 ? (
                    <div className={"hidden items-center justify-between lg:flex"}>
                        <Badge variant={"outline"} className={"gap-1.5 border-dashed"}>
                            <Coins className={"size-3 text-chart-5"}/>
                            <span className="text-xs">
                                <span className="tabular-nums">
                                    ${(text.length * COST_PER_UNIT).toFixed(4)}
                                </span>&nbsp;
                                estimated
                            </span>
                        </Badge>
                        <div className="flex items-center gap-3">
                            <p className="text-xs tracking-tight">
                                {text.length.toLocaleString()}
                                <span className="text-muted-foreground tabular-nums">
                                    &nbsp; / &nbsp; {TEXT_MAX_LENGTH.toLocaleString()} characters
                                </span>
                            </p>
                            <GenerateButton size="sm" isSubmitting={isSubmitting} onSubmit={() => form.handleSubmit()} disabled={isSubmitting || !isValid}/>
                        </div>
                    </div>
                ) : (
                    <div className="hidden lg:block">
                        <p className="text-sm text-muted-foreground">
                            Get started by typing or pasting text above
                        </p>
                    </div>
                )

                }
            </div>
        </div>
    );
}