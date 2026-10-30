import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/apiErrors";
import { loginWithGoogle } from "@/lib/neonAuth";

export const startGoogleSignIn = async (redirectPath: string): Promise<void> => {
  try {
    const result = await loginWithGoogle(redirectPath);
    if (!result.success) {
      toast.error(getSafeErrorMessage(new Error(result.error ?? ""), "Google sign-in failed."));
    }
  } catch (error) {
    toast.error(getSafeErrorMessage(error, "Google sign-in failed."));
  }
};
