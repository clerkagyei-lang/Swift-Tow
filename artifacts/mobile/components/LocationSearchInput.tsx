import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export interface SelectedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface Props {
  label: string;
  iconColor: string;
  value: string;
  onSelect: (loc: SelectedLocation) => void;
  onClear?: () => void;
  placeholder?: string;
}

export default function LocationSearchInput({
  label,
  iconColor,
  value,
  onSelect,
  onClear,
  placeholder,
}: Props) {
  const colors = useColors();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const search = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&countrycodes=gh&limit=5`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 450);
  };

  const handleSelect = (item: NominatimResult) => {
    const parts = item.display_name.split(",");
    const shortAddress = parts.slice(0, 3).join(",").trim();
    setQuery(shortAddress);
    setResults([]);
    setOpen(false);
    onSelect({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      address: shortAddress,
    });
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onClear?.();
  };

  const styles = makeStyles(colors);

  return (
    <View>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: iconColor }]} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={search}
          placeholder={placeholder ?? `Search ${label}...`}
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.icon} />
        ) : query.length > 0 ? (
          <Pressable onPress={handleClear} style={styles.icon} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : (
          <Ionicons name="search" size={14} color={colors.mutedForeground} style={styles.icon} />
        )}
      </View>

      {open && results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((item, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.result,
                i < results.length - 1 && styles.resultBorder,
                pressed && { backgroundColor: colors.accent },
              ]}
              onPress={() => handleSelect(item)}
            >
              <Ionicons name="location-outline" size={13} color={colors.primary} style={{ marginTop: 1 }} />
              <Text style={styles.resultText} numberOfLines={2}>
                {item.display_name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      flexShrink: 0,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      fontWeight: "500" as const,
    },
    icon: {
      flexShrink: 0,
    },
    dropdown: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 4,
      overflow: "hidden",
    },
    result: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    resultBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    resultText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
  });
}
