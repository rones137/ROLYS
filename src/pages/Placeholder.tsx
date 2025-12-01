import { Construction } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description?: string;
}

const Placeholder = ({ title, description }: PlaceholderProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <Construction className="w-24 h-24 text-muted-foreground mb-6" />
      <h1 className="text-4xl font-black text-foreground mb-3">{title}</h1>
      <p className="text-muted-foreground max-w-md">
        {description || "This feature is coming soon. Stay tuned!"}
      </p>
    </div>
  );
};

export default Placeholder;
