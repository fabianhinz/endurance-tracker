import { cn } from "../../lib/utils.ts";

export const glassClass = "bg-white/5 backdrop-blur-xl border border-white/10";

export const cardClass = `${glassClass} rounded-2xl shadow-lg flex flex-col`;

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "compact";
}

export const Card = (props: CardProps) => {
  const { className, children, variant = "default", ...rest } = props;
  return (
    <div
      className={cn(
        cardClass,
        variant === "compact" ? "p-2" : "p-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
};
