import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const DEFAULT_ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin1234",
};

export default function Login() {
  const [, setLocation] = useLocation();
  const loginMutation = useLogin();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    const isDefaultAdminLogin =
      values.username.toLowerCase() === DEFAULT_ADMIN_CREDENTIALS.username &&
      values.password === DEFAULT_ADMIN_CREDENTIALS.password;

    if (isDefaultAdminLogin) {
      localStorage.setItem("hmims_token", "demo-admin-token");
      toast({
        title: "Signed in",
        description: "Using the default admin account.",
      });
      setLocation("/dashboard");
      return;
    }

    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        localStorage.setItem("hmims_token", res.token);
        setLocation("/dashboard");
      },
      onError: () => {
        toast({
          title: "Login failed",
          description: "Invalid credentials.",
          variant: "destructive",
        });
      },
    });
  }

  return (
    <div className="min-h-screen grid md:grid-cols-[1.1fr_0.9fr] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(135deg,_hsl(var(--background))_0%,_hsl(var(--muted))_100%)]">
      {/* Left Panel - Branding */}
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary via-primary to-[hsl(var(--chart-2))] p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]" />
        
        <div className="relative z-10 text-center">
          <img
            src="/tana-river-logo.png"
            alt="County Government of Tana River"
            className="mx-auto w-[240px] h-[240px] object-contain mb-10 drop-shadow-2xl"
          />
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 drop-shadow-lg">HMIMS</h1>
          <p className="text-base uppercase font-semibold tracking-[0.24em] text-amber-200 mb-2">
            Enterprise Inventory System
          </p>
          <p className="text-xl text-white font-semibold mb-4">
            Hola Municipality
          </p>
          <p className="text-lg text-primary-foreground/80 max-w-md leading-relaxed">
            Inventory Management System
          </p>
        </div>

        <div className="relative z-10 space-y-3 text-primary-foreground/80">
          <div className="flex items-center gap-3">
            <div className="w-1 h-12 bg-accent rounded-full" />
            <div>
              <p className="font-semibold text-primary-foreground">Tana River County Government</p>
              <p className="text-sm">Procurement & Stock Control Platform</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-primary-foreground/60">
              Government of Kenya • Authorized Personnel Only
            </p>
            <p className="text-xs text-primary-foreground/40 mt-3">
              © Copyright 2026 Tana River County Government
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex items-center justify-center p-8 bg-background/70 backdrop-blur-sm">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-8">
            <img
              src="/tana-river-logo.png"
              alt="County Government of Tana River"
              className="mx-auto w-[200px] h-auto object-contain mb-4"
            />
            <h1 className="text-3xl font-bold text-foreground">HMIMS</h1>
            <p className="text-muted-foreground mt-1">Hola Municipality</p>
          </div>

          <div className="mb-8 pt-4">
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary mb-4">
              Secure access
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to access the inventory system</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground">Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        autoComplete="username"
                        {...field}
                        className="h-11 bg-card/90 border-border focus:border-primary transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        {...field}
                        className="h-11 bg-card/90 border-border focus:border-primary transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Authenticating..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <p>Secure access for authorized county personnel</p>
          </div>
        </div>
      </div>
    </div>
  );
}