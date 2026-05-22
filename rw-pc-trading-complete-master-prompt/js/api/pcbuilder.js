import { supabase } from "../supabaseClient.js";
import { PC_PART_TYPES } from "../config.js";

function findBySlot(parts, slot) {
  return parts.find((part) => part.slot === slot && part.product);
}

export async function listPcBuilderParts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      part_type,
      price,
      stock_quantity,
      power_draw_watts,
      compatibility,
      categories ( id, name ),
      product_images ( id, image_url, is_primary )
    `
    )
    .eq("is_active", true)
    .eq("is_archived", false)
    .in("part_type", PC_PART_TYPES)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data || []).map((item) => ({
    ...item,
    cover_image: item.product_images?.find((x) => x.is_primary)?.image_url || item.product_images?.[0]?.image_url || ""
  }));
}

export function evaluateBuildCompatibility(selectedParts = []) {
  const warnings = [];
  const info = [];

  const cpu = findBySlot(selectedParts, "CPU")?.product;
  const motherboard = findBySlot(selectedParts, "Motherboard")?.product;
  const ram = findBySlot(selectedParts, "RAM")?.product;
  const cooler = findBySlot(selectedParts, "CPU Cooler")?.product;
  const psu = findBySlot(selectedParts, "PSU")?.product;
  const gpu = findBySlot(selectedParts, "GPU")?.product;
  const pcCase = findBySlot(selectedParts, "Case")?.product;

  const cpuSocket = cpu?.compatibility?.cpu_socket;
  const mbSocket = motherboard?.compatibility?.cpu_socket;

  if (cpu && motherboard && cpuSocket && mbSocket && cpuSocket !== mbSocket) {
    warnings.push(`CPU socket (${cpuSocket}) does not match motherboard socket (${mbSocket}).`);
  }

  const ramType = ram?.compatibility?.ram_type;
  const mbRamType = motherboard?.compatibility?.ram_type;
  if (ram && motherboard && ramType && mbRamType && ramType !== mbRamType) {
    warnings.push(`RAM type (${ramType}) is incompatible with motherboard RAM type (${mbRamType}).`);
  }

  if (cpu && cooler && Array.isArray(cooler.compatibility?.supported_sockets)) {
    if (!cooler.compatibility.supported_sockets.includes(cpuSocket)) {
      warnings.push(`Selected CPU cooler does not support socket ${cpuSocket}.`);
    }
  }

  if (motherboard && pcCase) {
    const mbFormFactor = motherboard.compatibility?.form_factor;
    const supported = pcCase.compatibility?.supported_form_factors;
    if (mbFormFactor && Array.isArray(supported) && !supported.includes(mbFormFactor)) {
      warnings.push(`Case does not support motherboard form factor ${mbFormFactor}.`);
    }
  }

  const totalPartWattage = selectedParts.reduce(
    (sum, part) => sum + Number(part.product?.power_draw_watts || 0),
    0
  );
  const recommendedPsu = Math.ceil((totalPartWattage + 100) * 1.25);

  if (psu?.compatibility?.max_wattage && psu.compatibility.max_wattage < recommendedPsu) {
    warnings.push(
      `PSU wattage (${psu.compatibility.max_wattage}W) is lower than recommended (${recommendedPsu}W).`
    );
  }

  if (gpu?.compatibility?.gpu_length_mm && pcCase?.compatibility?.max_gpu_length_mm) {
    if (gpu.compatibility.gpu_length_mm > pcCase.compatibility.max_gpu_length_mm) {
      warnings.push("GPU may not fit in the selected case due to length limit.");
    }
  }

  if (!warnings.length) {
    info.push("Build compatibility check passed.");
  }

  return {
    isCompatible: warnings.length === 0,
    warnings,
    info,
    totalPartWattage,
    recommendedPsu
  };
}

export async function saveBuild(userId, buildName, selectedParts, compatibilityReport) {
  const totalPrice = selectedParts.reduce((sum, part) => sum + Number(part.product?.price || 0), 0);

  const { data, error } = await supabase
    .from("saved_builds")
    .insert({
      user_id: userId,
      name: buildName,
      total_price: totalPrice,
      estimated_wattage: compatibilityReport.totalPartWattage,
      recommended_psu_wattage: compatibilityReport.recommendedPsu,
      compatibility_report: compatibilityReport,
      items: selectedParts
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listSavedBuilds(userId) {
  const { data, error } = await supabase
    .from("saved_builds")
    .select("id, name, total_price, estimated_wattage, recommended_psu_wattage, compatibility_report, items, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
