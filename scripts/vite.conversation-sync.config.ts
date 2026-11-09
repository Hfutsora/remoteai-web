import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config';

export default defineConfig(environment => mergeConfig(base(environment), { server: { watch: null } }));
