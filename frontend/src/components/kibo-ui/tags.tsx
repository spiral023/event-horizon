import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command as CommandPrimitive } from "cmdk";
import { X, ChevronsUpDown, Check } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

// Context for managing tags state
type TagsContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
};

const TagsContext = React.createContext<TagsContextType | undefined>(undefined);

const useTagsContext = () => {
  const context = React.useContext(TagsContext);
  if (!context) {
    throw new Error("Tags components must be used within a Tags component");
  }
  return context;
};

// Main Tags container
const Tags = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  return (
    <TagsContext.Provider value={{ open, setOpen, searchValue, setSearchValue }}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <div ref={ref} className={cn("relative", className)} {...props}>
          {children}
        </div>
      </PopoverPrimitive.Root>
    </TagsContext.Provider>
  );
});
Tags.displayName = "Tags";

// Tags trigger button
const TagsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { setOpen } = useTagsContext();

  return (
    <PopoverPrimitive.Trigger asChild>
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {React.Children.count(children) > 0 ? (
            children
          ) : (
            <span className="text-muted-foreground">Tags auswählen...</span>
          )}
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>
    </PopoverPrimitive.Trigger>
  );
});
TagsTrigger.displayName = "TagsTrigger";

// Individual selected tag value
const TagsValue = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onRemove?: () => void;
  }
>(({ className, children, onRemove, ...props }, ref) => {
  return (
    <Badge
      ref={ref}
      variant="secondary"
      className={cn(
        "flex items-center gap-1 pl-2 pr-1 py-0.5 text-xs font-medium",
        className
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
});
TagsValue.displayName = "TagsValue";

// Tags popover content
const TagsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <PopoverPrimitive.Content
      ref={ref}
      align="start"
      className={cn(
        "w-[var(--radix-popover-trigger-width)] p-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none z-50",
        className
      )}
      {...props}
    >
      <Command className="rounded-md">
        {children}
      </Command>
    </PopoverPrimitive.Content>
  );
});
TagsContent.displayName = "TagsContent";

// Tags input for search
const TagsInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof CommandInput>
>(({ className, ...props }, ref) => {
  const { searchValue, setSearchValue } = useTagsContext();

  return (
    <CommandInput
      ref={ref}
      value={searchValue}
      onValueChange={setSearchValue}
      className={className}
      {...props}
    />
  );
});
TagsInput.displayName = "TagsInput";

// Tags list
const TagsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CommandList>
>(({ className, ...props }, ref) => {
  return (
    <CommandList
      ref={ref}
      className={cn("max-h-[200px]", className)}
      {...props}
    />
  );
});
TagsList.displayName = "TagsList";

// Empty state
const TagsEmpty = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CommandEmpty>
>((props, ref) => {
  return <CommandEmpty ref={ref} {...props}>Keine Tags gefunden</CommandEmpty>;
});
TagsEmpty.displayName = "TagsEmpty";

// Tags group
const TagsGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CommandGroup>
>(({ className, ...props }, ref) => {
  return <CommandGroup ref={ref} className={className} {...props} />;
});
TagsGroup.displayName = "TagsGroup";

// Individual tag item
const TagsItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CommandItem> & {
    onSelect: (value: string) => void;
    value: string;
  }
>(({ className, children, onSelect, value, ...props }, ref) => {
  return (
    <CommandItem
      ref={ref}
      value={value}
      onSelect={() => onSelect(value)}
      className={cn("cursor-pointer justify-between", className)}
      {...props}
    >
      {children}
    </CommandItem>
  );
});
TagsItem.displayName = "TagsItem";

export {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsInput,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
};
