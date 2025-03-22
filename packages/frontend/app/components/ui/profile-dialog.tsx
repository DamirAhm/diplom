import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDictionary } from "@/hooks/use-dictionary";
interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (type: string, url: string) => void;
  availableTypes: Array<{ key: string; label: string }>;
}

export function ProfileDialog({
  open,
  onOpenChange,
  onSubmit,
  availableTypes,
}: ProfileDialogProps) {
  const [selectedType, setSelectedType] = React.useState<string>("");
  const [url, setUrl] = React.useState("");
  const dictionary = useDictionary();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType && url) {
      onSubmit(selectedType, url);
      setSelectedType("");
      setUrl("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dictionary.admin.addProfile}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">{dictionary.admin.profileType}</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder={dictionary.admin.selectProfileType} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {availableTypes.map(({ key, label }) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">{dictionary.admin.url}</Label>
            <Input
              id="url"
              type="url"
              value={url}
              placeholder={dictionary.admin.enterProfileUrl}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {dictionary.common.cancel}
            </Button>
            <Button type="submit">{dictionary.common.add}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
