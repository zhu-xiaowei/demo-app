/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';

import { Colors } from 'react-native/Libraries/NewAppScreen';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'web-streams-polyfill/dist/polyfill';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({ children, title }: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

type CallbackFunction = (result: string) => void;
export const invokeModelWithResponseStream = async (
  prompt: string,
  callback: CallbackFunction
) => {
  const modelId = 'anthropic.claude-3-haiku-20240307-v1:0';
  const client = new BedrockRuntimeClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: '',
      secretAccessKey: '',
    },
  });
  // Prepare the payload for the model.
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: prompt }],
      },
    ],
  };

  const command = new InvokeModelWithResponseStreamCommand({
    contentType: 'application/json',
    body: JSON.stringify(payload),
    modelId,
  });
  const apiResponse = await client.send(command);
  let completeMessage = '';

  for await (const item of apiResponse.body!) {
    const chunk = JSON.parse(new TextDecoder().decode(item.chunk!.bytes));
    const chunk_type = chunk.type;

    if (chunk_type === 'content_block_delta') {
      const text = chunk.delta.text;
      completeMessage = completeMessage + text;
      callback(completeMessage);
    }
  }
};

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [resultText, setResultText] = React.useState('...');

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  useEffect(() => {
    try {
      invokeModelWithResponseStream('Hi', (result: string) => {
        setResultText(result);
      }).then();
    } catch (error) {
      console.error('Error fetching model response:', error);
      setResultText('An error occurred while invoking model.' + error);
    }
  }, []);

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Section title="Hi">{resultText}</Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
});

export default App;
