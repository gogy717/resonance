import { WavyBackground } from "@/components/ui/wavy-background";

export function HeroPattern() {
    return(
        <div className={"pointer-events-none absolute inset-0 hidden overflow-hidden lg:block"}>
            <WavyBackground
                colors={["#2DD4BF", "#22D3EE", "#38BDF8", "#818CF8"]}
                backgroundFill={"hsl(0 0% 100%)"}
                blur={4}
                speed={"fast"}
                waveOpacity={0.1}
                waveWidth={60}
                waveYOffset={300}
                containerClassName={"h-full"}
                className={"hidden"}
            />
        </div>
    )
}