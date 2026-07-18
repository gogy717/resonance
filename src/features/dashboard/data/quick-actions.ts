export interface QuickAction {
    title: string;
    description: string;
    gradient: string;
    href: string;
}

const createTextToSpeechHref = (text: string) =>
    `/text-to-speech?text=${encodeURIComponent(text)}`;

export const quickActions: QuickAction[] = [
    {
        title: "Narrate a Story",
        description: "Bring characters to life with expressive AI narration",
        gradient: "from-cyan-400 to-cyan-50",
        href: createTextToSpeechHref(
            "In a village tucked away in the mountains, there lived a young girl named Lila. " +
            "She had a special gift—the ability to communicate with animals. One day, while exploring the forest, " +
            "Lila stumbled upon a wounded fox. Using her gift, she spoke to the fox and learned that it had been " +
            "injured by a hunter's trap. Determined to help, Lila carefully freed the fox and tended to its wounds. " +
            "In return for her kindness, the fox led Lila to a hidden grove filled with magical creatures who became " +
            "her lifelong friends.",
        ),
    },
    {
        title: "Record an Ad",
        description: "Create professional advertisements with lifelike AI voices",
        gradient: "from-pink-400 to-pink-100",
        href: createTextToSpeechHref(
            "Meet Lumina, the smart light that transforms every room with a single touch. " +
            "Choose the perfect color, set the mood, and make your home feel uniquely yours. " +
            "Lumina—brilliant lighting, beautifully simple.",
        ),
    },
    {
        title: "Direct a Movie Scene",
        description: "Generate dramatic dialogue for film and video",
        gradient: "from-violet-500 to-violet-100",
        href: createTextToSpeechHref(
            "The storm is getting closer. If we leave now, we may still reach the bridge before midnight. " +
            "But if you're wrong, there will be no road back. I know. That's why I need you to trust me one last time.",
        ),
    },
    {
        title: "Voice a Game Character",
        description: "Build immersive worlds with dynamic character voices",
        gradient: "from-orange-400 to-orange-100",
        href: createTextToSpeechHref(
            "Halt, traveler. Beyond this gate lies the Ember Kingdom, where the mountains breathe fire and shadows " +
            "remember every name. If you still wish to enter, draw your sword and prove your courage.",
        ),
    },
    {
        title: "Introduce Your Podcast",
        description: "Hook your listeners from the very first second",
        gradient: "from-blue-500 to-blue-100",
        href: createTextToSpeechHref(
            "Welcome to The Curious Mind, the podcast where bold questions lead to unexpected discoveries. " +
            "Each week, we meet the thinkers, makers, and explorers changing how we see the world. Let's begin.",
        ),
    },
    {
        title: "Guide a Meditation",
        description: "Craft soothing, calming audio for wellness content",
        gradient: "from-lime-400 to-lime-100",
        href: createTextToSpeechHref(
            "Find a comfortable position and gently close your eyes. Take a slow breath in, hold it for a moment, " +
            "and breathe out. Let your shoulders soften as you bring your attention to the calm rhythm of your breath.",
        ),
    },
];
