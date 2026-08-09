"use client"

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner"

interface GenerateButtonProps {
    size?: "default" | "sm";
    disabled: boolean;
    isSubmitting: boolean;
    onSubmit: () => void | Promise<void>;
    className?: string;
}

export function GenerateButton({
    size = "default",
    disabled,
    isSubmitting,
    onSubmit,
    className,
   } : GenerateButtonProps) {
    return (
        <Button type="button"
                size={size}
                className={className}
                onClick={onSubmit}
                disabled={disabled}
                aria-busy={isSubmitting}>
            {isSubmitting
                ? (
                <>
                    <Spinner className="size-3" />
                    Generating...
                </>
            )
                : (
                    "Generate Speech"
            )}
        </Button>
    )
}

