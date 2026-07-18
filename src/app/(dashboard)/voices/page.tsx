import { VoiceCard } from "@/features/voices/components/voice-card";

// 服务器组件：以后把这份假数据换成 Prisma 查询（await prisma.voice.findMany(...)）即可
const demoVoices = [
    { id: "1", name: "Aria", description: "Warm, conversational female voice" },
    { id: "2", name: "Kai", description: "Deep, calm male narrator" },
    { id: "3", name: "Nova", description: "Bright, energetic assistant voice" },
];

export default function VoicesPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold">Explore voices</h1>
            <p className="text-sm text-muted-foreground mt-1">
                Pick a voice to preview it.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {demoVoices.map((voice) => (
                    <VoiceCard key={voice.id} voice={voice} />
                ))}
            </div>
        </div>
    );
}
