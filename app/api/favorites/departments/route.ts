import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Fetch all favorite department IDs for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize database connection" },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch favorite department IDs
    const { data: favorites, error: favoritesError } = await supabase
      .from("user_favorite_departments")
      .select("department_id")
      .eq("user_id", user.id);

    if (favoritesError) {
      return NextResponse.json(
        { error: `Failed to fetch favorites: ${favoritesError.message}` },
        { status: 400 }
      );
    }

    // Return array of department IDs
    const departmentIds = favorites?.map((fav) => fav.department_id) || [];
    return NextResponse.json({ favoriteIds: departmentIds });
  } catch (error: any) {
    console.error("Error fetching favorite departments:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST: Add a department to favorites
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { departmentId } = body;

    if (!departmentId) {
      return NextResponse.json(
        { error: "departmentId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize database connection" },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Insert favorite (will fail if duplicate due to unique constraint)
    const { error: insertError } = await supabase
      .from("user_favorite_departments")
      .insert({
        user_id: user.id,
        department_id: departmentId,
      });

    if (insertError) {
      // If already exists, return success anyway
      if (insertError.code === "23505") {
        // Unique constraint violation
        return NextResponse.json({
          success: true,
          message: "Department already in favorites",
        });
      }

      return NextResponse.json(
        { error: `Failed to add favorite: ${insertError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Department added to favorites",
    });
  } catch (error: any) {
    console.error("Error adding favorite department:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE: Remove a department from favorites
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    if (!departmentId) {
      return NextResponse.json(
        { error: "departmentId query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize database connection" },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Delete favorite
    const { error: deleteError } = await supabase
      .from("user_favorite_departments")
      .delete()
      .eq("user_id", user.id)
      .eq("department_id", departmentId);

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to remove favorite: ${deleteError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Department removed from favorites",
    });
  } catch (error: any) {
    console.error("Error removing favorite department:", error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
