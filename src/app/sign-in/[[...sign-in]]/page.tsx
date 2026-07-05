import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
      <div className={"flex min-h-screen flex-col items-center justify-center bg-background"}>
          <SignIn
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
