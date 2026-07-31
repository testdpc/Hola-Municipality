import { useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

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
    loginMutation.mutate(
      { data: values },
      {
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
      },
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary via-primary to-[hsl(142,52%,25%)] p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]" />

        <div className="relative z-10">
          <img
            src="/tana-river-logo.jpeg"
            alt="County Government of Tana River"
            className="w-80 h-80 object-contain mb-8 drop-shadow-2xl"
          />
          <h1 className="text-5xl font-extrabold tracking-tight mb-3 drop-shadow-lg">
            HMIMS
          </h1>
          <p className="text-xl text-primary-foreground/90 font-medium mb-2">
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
              <p className="font-semibold text-primary-foreground">
                Tana River County Government
              </p>
              <p className="text-sm">Procurement & Stock Control Platform</p>
            </div>
          </div>
          <p className="text-xs text-primary-foreground/60 pl-6">
            Government of Kenya • Authorized Personnel Only
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-8">
            <img
              src="/tana-river-logo.jpeg"
              alt="County Government of Tana River"
              className="mx-auto w-24 h-24 object-contain mb-4"
            />
            <h1 className="text-3xl font-bold text-foreground">HMIMS</h1>
            <p className="text-muted-foreground mt-1">Hola Municipality</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Sign in to access the inventory system
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        {...field}
                        className="h-11 bg-card border-border focus:border-primary transition-colors"
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
                    <FormLabel className="text-sm font-semibold text-foreground">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                        className="h-11 bg-card border-border focus:border-primary transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
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
