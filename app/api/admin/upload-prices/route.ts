import { NextRequest, NextResponse } from "next/server";

// Disable caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * POST /api/admin/upload-prices
 * Upload carrier pricing data via CSV/Excel file
 */
export async function POST(request: NextRequest) {
  try {
    // Get admin token
    let token = request.cookies.get("admin_auth_token")?.value;
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { detail: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const carrier = formData.get("carrier") as string;

    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    if (!carrier) {
      return NextResponse.json(
        { detail: "Carrier not specified" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { detail: "File must be CSV or Excel format" },
        { status: 400 },
      );
    }

    // Convert file to buffer for forwarding
    const fileBuffer = await file.arrayBuffer();

    // Create new FormData for backend
    const backendFormData = new FormData();
    backendFormData.append("file", new Blob([fileBuffer]), file.name);
    backendFormData.append("carrier", carrier);

    // Forward to backend
    const response = await fetch(`${API_BASE_URL}/api/admin/upload-prices`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendFormData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to upload pricing data" }));
      return NextResponse.json(
        { detail: error.detail || "Failed to upload pricing data" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Admin upload prices error:", error);
    return NextResponse.json(
      { detail: "Internal server error" },
      { status: 500 },
    );
  }
}
