import {TextInputPanel} from "@/features/text-to-speech/components/text-input-panel";
import {TextToSpeechLayout} from "@/features/text-to-speech/views/text-to-speech-layout";
import {VoicePreviewPlaceholder} from "@/features/text-to-speech/components/voice-preview-placeholder";
import {SettingsPanel} from "@/features/text-to-speech/components/settings-panel";
import {defaultTTSValues, TextToSpeechForm} from "@/features/text-to-speech/components/text-to-speech-form";


export function TextToSpeechView() {
    return (
        <TextToSpeechForm defaultValues={defaultTTSValues}>
            <TextToSpeechLayout>
                <div className="flex min-h-0 flex-1 overflow-hidden">
                    <div className="flex min-h-0 flex-1 flex-col">
                        <TextInputPanel />
                        <VoicePreviewPlaceholder />
                    </div>
                    <SettingsPanel />
                </div>
            </TextToSpeechLayout>
        </TextToSpeechForm>

    );
}
