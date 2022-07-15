import type { LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader: LoaderFunction = ({ request }) => {
  return redirect("dashboard");
};

export default function IndexRoute() {
  return (
    <div>
      <h1>Localizard</h1>
    </div>
  );
}
