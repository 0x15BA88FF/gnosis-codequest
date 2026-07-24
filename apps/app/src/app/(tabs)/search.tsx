import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Brain, X, FileText, Link as LinkIcon, ChevronDown, Sparkles } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useAllMinds, useAskQuery } from '@/lib/hooks';
import { queryClient } from '@/lib/query-client';
import type { Citation, Mind } from '@/lib/api-types';
import { Markdown } from '@/components/Markdown';
import { FLOATING_TABBAR_HEIGHT } from './_layout';

const SUGGESTIONS = [
  "Summarize last quarter's wins",
  'What changed in the API?',
  'Onboarding steps for new engineers',
];

function getInitialMindIds(): string[] {
  const cached = queryClient.getQueryData<Mind[]>(['dashboard', 'allMinds']);
  return cached?.map((m) => m.id) ?? [];
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: minds = [] } = useAllMinds(token);
  const askMutation = useAskQuery(token);

  const [mindMenuOpen, setMindMenuOpen] = useState(false);
  const [selectedMindIds, setSelectedMindIds] = useState<string[]>(getInitialMindIds);

  const noMinds = minds.length === 0;
  const hasResult = answer !== null;

  const submit = useCallback(async () => {
    const q = query.trim();
    if (!q || askMutation.isPending) return;

    if (noMinds) {
      setError('Add a Mind with documents before searching.');
      return;
    }
    if (selectedMindIds.length === 0) {
      setError('Select at least one Mind to search.');
      return;
    }

    setError(null);
    setAnswer(null);
    setCitations([]);

    try {
      const res = await askMutation.mutateAsync({
        query: q,
        mindIds: selectedMindIds,
      });
      setAnswer(res.answer);
      setCitations(res.citations);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong while searching your knowledge.');
    }
  }, [query, askMutation, noMinds, selectedMindIds]);

  const toggleMind = (id: string) => {
    setSelectedMindIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <KeyboardAvoidingView
      style={cn('flex-1 bg-background')}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View
        style={[
          cn('border-b border-border px-6 py-4 bg-card shadow-sm'),
          { paddingTop: insets.top + 8 },
        ]}
      >
        <Text style={cn('text-xl font-sans font-bold text-foreground tracking-tight')}>
          Search
        </Text>
        <Text style={cn('text-2xs font-sans text-primary font-semibold uppercase tracking-wider')}>
          Ask your Minds
        </Text>
      </View>

      {/* Search input at the top */}
      <View style={cn('px-6 pt-4 pb-3')}>
        <View
          style={cn(
            'flex-row items-end bg-muted border border-border rounded-xl p-2 pl-4 gap-3'
          )}
        >
          <TextInput
            style={cn('flex-1 font-sans text-foreground text-base max-h-32 py-1.5')}
            placeholder="Search your knowledge…"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            returnKeyType="search"
            multiline
          />
          <Pressable
            onPress={submit}
            disabled={askMutation.isPending || !query.trim()}
            style={({ pressed }) =>
              cn(
                'w-9 h-9 rounded-lg items-center justify-center',
                query.trim() && !askMutation.isPending ? 'bg-primary' : 'bg-border',
                pressed && query.trim() && !askMutation.isPending && 'opacity-90'
              )
            }
          >
            {askMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Search size={18} strokeWidth={2} color="#ffffff" />
            )}
          </Pressable>
        </View>
      </View>

      {/* Mind selector */}
      <View style={cn('px-6 pb-3')}>
        <Pressable
          onPress={() => setMindMenuOpen((v) => !v)}
          style={({ pressed }) =>
            cn(
              'flex-row items-center justify-between bg-muted border border-border rounded-md p-4',
              pressed && 'opacity-70'
            )
          }
        >
          <View style={cn('flex-row items-center gap-2')}>
            <Brain size={16} strokeWidth={2} color="#e35d1e" />
            <Text style={cn('text-sm font-sans text-foreground')}>
              {noMinds
                ? 'No Minds yet'
                : selectedMindIds.length === minds.length
                ? `All Minds (${minds.length})`
                : `${selectedMindIds.length} Mind${selectedMindIds.length === 1 ? '' : 's'} selected`}
            </Text>
          </View>
          <ChevronDown size={16} strokeWidth={2} color="#686868" />
        </Pressable>

        {mindMenuOpen && (
          <View style={cn('mt-2 bg-card border border-border rounded-md p-2 shadow-sm')}>
            {minds.map((mind) => {
              const active = selectedMindIds.includes(mind.id);
              return (
                <Pressable
                  key={mind.id}
                  onPress={() => toggleMind(mind.id)}
                  style={({ pressed }) =>
                    cn(
                      'flex-row items-center justify-between px-3 py-2.5 rounded-sm',
                      pressed && 'bg-muted'
                    )
                  }
                >
                  <Text
                    style={cn(
                      'text-sm font-sans',
                      active ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    )}
                  >
                    {mind.name}
                  </Text>
                  <View
                    style={cn(
                      'w-4 h-4 rounded-sm border items-center justify-center',
                      active ? 'bg-primary border-primary' : 'border-border'
                    )}
                  >
                    {active && <Text style={cn('text-primary-foreground text-3xs font-bold')}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
            {minds.length === 0 && (
              <Text style={cn('text-sm font-sans text-muted-foreground px-3 py-2')}>
                No Minds available.
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Results / empty state */}
      <ScrollView
        contentContainerStyle={[
          cn('px-6 py-4 gap-4'),
          { paddingBottom: insets.bottom + FLOATING_TABBAR_HEIGHT + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Empty state */}
        {!hasResult && !askMutation.isPending && (
          <View style={cn('gap-4 mt-2')}>
            <View style={cn('bg-accent border border-accent p-6 rounded-xl shadow-sm')}>
              <View style={cn('flex-row items-center gap-2 mb-2')}>
                <Sparkles size={16} strokeWidth={2} color="#c24318" />
                <Text style={cn('text-sm font-sans font-bold text-accent-foreground')}>
                  Search your knowledge
                </Text>
              </View>
              <Text style={cn('text-sm font-sans text-muted-foreground leading-5')}>
                Get answers from your uploaded documents. Responses include cited sources.
              </Text>
            </View>
            <View style={cn('gap-2')}>
              {SUGGESTIONS.map((s, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => { setQuery(s); }}
                  style={({ pressed }) =>
                    cn(
                      'bg-card border border-border px-4 py-3 rounded-md',
                      pressed && 'bg-muted'
                    )
                  }
                >
                  <Text style={cn('text-sm font-sans text-foreground')}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Loading state */}
        {askMutation.isPending && (
          <View style={cn('items-center justify-center py-12')}>
            <ActivityIndicator size="large" color="#e35d1e" />
            <Text style={cn('text-sm font-sans text-muted-foreground mt-3')}>
              Searching…
            </Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <Text style={cn('text-sm font-sans text-destructive px-1')}>{error}</Text>
        )}

        {/* Response */}
        {hasResult && !askMutation.isPending && (
          <View style={cn('gap-4')}>
            <View style={cn('bg-card border border-border rounded-xl p-5 shadow-sm')}>
              <Markdown content={answer!} />
            </View>

            {citations.length > 0 && (
              <View style={cn('gap-3')}>
                <Text
                  style={cn(
                    'text-3xs font-sans text-muted-foreground font-semibold uppercase tracking-wider'
                  )}
                >
                  Sources
                </Text>
                {citations.map((c) => (
                  <View
                    key={c.chunkId}
                    style={cn(
                      'bg-card border border-border rounded-xl p-4 gap-2'
                    )}
                  >
                    <View style={cn('flex-row items-center gap-2')}>
                      <FileText size={14} strokeWidth={2} color="#e35d1e" />
                      <Text style={cn('text-sm font-sans font-semibold text-foreground')}>
                        {c.fileName}
                      </Text>
                    </View>
                    <Text
                      style={cn('text-xs font-sans text-muted-foreground leading-4')}
                      numberOfLines={4}
                    >
                      {c.content}
                    </Text>
                    <View style={cn('flex-row items-center gap-1.5')}>
                      <LinkIcon size={12} strokeWidth={2} color="#9ca3af" />
                      <Text style={cn('text-3xs font-sans text-primary font-semibold')}>
                        {(c.score * 100).toFixed(1)}% relevant
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
