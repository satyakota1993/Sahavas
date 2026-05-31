import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function UnauthorizedPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Access not available</CardTitle>
        <CardDescription>
          Your account does not have permission for this Sahavas area.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link to="/select-society">Choose society</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
