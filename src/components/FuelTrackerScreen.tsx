import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFuelLogs } from '../hooks/useFuelLogs';
import { formatCurrency, formatDate, formatNumber } from '../utils/format';

const initialForm = {
  liters: '',
  totalPrice: '',
  pricePerLiter: '',
  odometer: '',
  fuelType: 'Gasoline',
  stationName: '',
  notes: '',
  partialTankPercent: '',
  isFullTank: true,
};

export function FuelTrackerScreen() {
  const { logs, summary, addLog, deleteLog, isLoaded } = useFuelLogs();
  const [form, setForm] = useState(initialForm);
  const [autoMode, setAutoMode] = useState<'total' | 'unit'>('total');

  const computedValue = useMemo(() => {
    const liters = Number(form.liters);
    const totalPrice = Number(form.totalPrice);
    const pricePerLiter = Number(form.pricePerLiter);

    if (!liters || liters <= 0) {
      return '';
    }

    if (autoMode === 'total' && totalPrice > 0) {
      return (totalPrice / liters).toFixed(3);
    }

    if (autoMode === 'unit' && pricePerLiter > 0) {
      return (pricePerLiter * liters).toFixed(2);
    }

    return '';
  }, [autoMode, form.liters, form.pricePerLiter, form.totalPrice]);

  const submit = async () => {
    const liters = Number(form.liters);
    const totalPrice = autoMode === 'unit' ? Number(computedValue) : Number(form.totalPrice);
    const pricePerLiter = autoMode === 'total' ? Number(computedValue) : Number(form.pricePerLiter);
    const odometer = Number(form.odometer);
    const partialTankPercent = form.partialTankPercent ? Number(form.partialTankPercent) : undefined;

    if (!liters || !totalPrice || !pricePerLiter || !odometer) {
      Alert.alert('Missing information', 'Please provide liters, total price, price per liter, and odometer.');
      return;
    }

    if (logs[0] && odometer <= logs[0].odometer) {
      Alert.alert('Invalid odometer', 'The new odometer reading must be higher than the latest saved entry.');
      return;
    }

    await addLog({
      liters,
      totalPrice,
      pricePerLiter,
      odometer,
      isFullTank: form.isFullTank,
      fuelType: form.fuelType,
      stationName: form.stationName.trim(),
      notes: form.notes.trim(),
      partialTankPercent,
    });

    setForm(initialForm);
    setAutoMode('total');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Fuel Consumption Tracker</Text>
        <Text style={styles.subheading}>
          Log every fill-up, monitor your efficiency, and keep your running fuel costs under control.
        </Text>

        <View style={styles.summaryRow}>
          <SummaryCard label="Total spend" value={formatCurrency(summary.totalSpend)} />
          <SummaryCard label="Total liters" value={formatNumber(summary.totalLiters)} />
        </View>
        <View style={styles.summaryRow}>
          <SummaryCard label="Avg / liter" value={formatCurrency(summary.averagePricePerLiter)} />
          <SummaryCard
            label="Last L/100km"
            value={summary.lastConsumptionLPer100Km ? formatNumber(summary.lastConsumptionLPer100Km) : '—'}
          />
        </View>
        <View style={styles.summaryRow}>
          <SummaryCard
            label="Last km/L"
            value={summary.lastConsumptionKmPerLiter ? formatNumber(summary.lastConsumptionKmPerLiter) : '—'}
          />
          <SummaryCard
            label="Distance tracked"
            value={summary.totalDistance ? `${formatNumber(summary.totalDistance, 0)} km` : '—'}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>New fuel entry</Text>

          <Field label="Fuel amount (liters)" value={form.liters} onChangeText={(value) => setForm({ ...form, liters: value })} keyboardType="decimal-pad" />
          <Field label="Current odometer" value={form.odometer} onChangeText={(value) => setForm({ ...form, odometer: value })} keyboardType="decimal-pad" />

          <View style={styles.toggleRow}>
            <Text style={styles.label}>Use entered value as</Text>
            <View style={styles.segmentRow}>
              <Segment selected={autoMode === 'total'} label="Total price" onPress={() => setAutoMode('total')} />
              <Segment selected={autoMode === 'unit'} label="Price/L" onPress={() => setAutoMode('unit')} />
            </View>
          </View>

          {autoMode === 'total' ? (
            <>
              <Field label="Total price" value={form.totalPrice} onChangeText={(value) => setForm({ ...form, totalPrice: value })} keyboardType="decimal-pad" />
              <ReadOnlyField label="Calculated price per liter" value={computedValue || '0.000'} />
            </>
          ) : (
            <>
              <Field label="Price per liter" value={form.pricePerLiter} onChangeText={(value) => setForm({ ...form, pricePerLiter: value })} keyboardType="decimal-pad" />
              <ReadOnlyField label="Calculated total price" value={computedValue || '0.00'} />
            </>
          )}

          <Field label="Fuel type" value={form.fuelType} onChangeText={(value) => setForm({ ...form, fuelType: value })} />
          <Field label="Station name" value={form.stationName} onChangeText={(value) => setForm({ ...form, stationName: value })} />
          <Field label="Tank before fill (%)" value={form.partialTankPercent} onChangeText={(value) => setForm({ ...form, partialTankPercent: value })} keyboardType="decimal-pad" />
          <Field label="Notes" value={form.notes} onChangeText={(value) => setForm({ ...form, notes: value })} multiline />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Full tank?</Text>
              <Text style={styles.helper}>Turn this off for partial fills. Efficiency is calculated on full-tank fill-ups.</Text>
            </View>
            <Switch value={form.isFullTank} onValueChange={(value) => setForm({ ...form, isFullTank: value })} />
          </View>

          <Pressable style={styles.primaryButton} onPress={submit}>
            <Text style={styles.primaryButtonText}>Save entry</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>History</Text>
          {!isLoaded ? <Text style={styles.helper}>Loading entries...</Text> : null}
          {logs.length === 0 ? <Text style={styles.helper}>No fill-ups yet. Add your first one above.</Text> : null}

          {logs.map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={styles.logHeader}>
                <View>
                  <Text style={styles.logTitle}>{log.stationName || log.fuelType}</Text>
                  <Text style={styles.helper}>{formatDate(log.date)} · {log.odometer} km</Text>
                </View>
                <Pressable onPress={() => deleteLog(log.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>

              <View style={styles.logStatsRow}>
                <LogPill label="Liters" value={formatNumber(log.liters)} />
                <LogPill label="Total" value={formatCurrency(log.totalPrice)} />
                <LogPill label="Price/L" value={formatCurrency(log.pricePerLiter)} />
              </View>
              <View style={styles.logStatsRow}>
                <LogPill label="Trip" value={log.tripDistance ? `${formatNumber(log.tripDistance, 0)} km` : '—'} />
                <LogPill label="L/100km" value={log.consumptionLPer100Km ? formatNumber(log.consumptionLPer100Km) : '—'} />
                <LogPill label="km/L" value={log.consumptionKmPerLiter ? formatNumber(log.consumptionKmPerLiter) : '—'} />
              </View>
              {log.notes ? <Text style={styles.noteText}>{log.notes}</Text> : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType}
        multiline={props.multiline}
        style={[styles.input, props.multiline ? styles.multilineInput : null]}
        placeholder={props.label}
        placeholderTextColor="#94a3b8"
      />
    </View>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.readOnlyBox}>
        <Text style={styles.readOnlyText}>{value}</Text>
      </View>
    </View>
  );
}

function Segment({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segment, selected ? styles.segmentSelected : null]}>
      <Text style={[styles.segmentText, selected ? styles.segmentTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function LogPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef4ff',
  },
  container: {
    padding: 18,
    gap: 16,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },
  fieldWrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 16,
    backgroundColor: '#f8fbff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  readOnlyBox: {
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#1d4ed8',
    fontWeight: '700',
  },
  toggleRow: {
    marginBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  segmentSelected: {
    backgroundColor: '#2563eb',
  },
  segmentText: {
    fontWeight: '600',
    color: '#334155',
  },
  segmentTextSelected: {
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  helper: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  logItem: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 14,
    marginTop: 14,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  deleteText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  logStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    padding: 12,
  },
  pillLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  pillValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  noteText: {
    color: '#475569',
    marginTop: 4,
  },
});
