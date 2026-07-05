import { OrganizationList } from "@clerk/nextjs";

export default function OrgSelectionPage() {
    return (
        <div className={"flex min-h-screen flex-col items-center justify-center bg-background"}>
            <OrganizationList
                hidePersonal
                afterCreateOrganizationUrl={"/"}
                afterSelectOrganizationUrl={"/"}
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-lg",
                    },
                }}
            />
        </div>
    );
}

