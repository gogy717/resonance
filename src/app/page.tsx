import {OrganizationSwitcher, UserButton} from "@clerk/nextjs";


export default function Home() {
    return (
        <div className={"flex min-h-screen flex-col items-center justify-center bg-background"}>
            <h1 className={"text-3xl font-bold"}>Welcome to Resonance</h1>
            <div className={"flex items-center gap-4 mt-4"}>
                <OrganizationSwitcher />
                <UserButton />
            </div>
        </div>
    );
}

