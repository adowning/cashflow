<script setup lang="ts">
import { getAllUsersQueryOptions } from '@/client/api'
import { useDashboardStore } from '@/stores/dashboard.store'
import { debounce } from '@/utils/debounce'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import { useQuery } from '@tanstack/vue-query'
import type { User } from 'better-auth'
import { upperFirst } from 'scule'
import { computed, h, onMounted, ref, resolveComponent, useTemplateRef, watch } from 'vue'

const UAvatar = resolveComponent( 'UAvatar' );
const UButton = resolveComponent( 'UButton' );
const UBadge = resolveComponent( 'UBadge' );
const UDropdownMenu = resolveComponent( 'UDropdownMenu' );
const UCheckbox = resolveComponent( 'UCheckbox' );

const toast = useToast();
const table = useTemplateRef('table');
const dashboardStore = useDashboardStore();
/**
 * Pagination state for the players table.
 */
const pagination = ref( {
  pageIndex: 1,
  pageSize: 10,
  query: 'asdf'
} );

const columnFilters = ref( [ {
  id: 'email',
  value: ''
} ] );
const columnVisibility = ref();
const rowSelection = ref( { 1: true } );
  const page = ref(0)
  const perPage = ref(20)
const search = ref('')
const mappedPlayers2 = ref()
 const debouncedSearch = useDebounceFn((val) => {
  // do something
  search.value = val
  return search.value
}, 1000)

const { isPending, error, data } = useQuery(
    getAllUsersQueryOptions({
      query: pagination.value.query,
     page: pagination.value.pageIndex,
     perPage: pagination.value.pageSize,
    }),
  );

 watch(data, (data) => {
  if(data && data.length)
    mappedPlayers2.value  = data.map( player => ( {
    id: player.id,
    name: player.name,
    email: player.email || '',
    avatar: { src: player.image, alt: player.name },
    status: player.banned ? 'banned' : 'active',//.status.toLowerCase() as 'active' | 'inactive' | 'banned',
    location: '', // This field is being replaced with lastLoginAt
    lastLoginAt: player.createdAt,
    username: player.name,
    avatarUrl: player.name
  } ) );
    });

/**
 * Map API player data to the format expected by the table component.
 * Transforms DashboardPlayer[] to the internal User type for compatibility.
 */
const mappedPlayers = computed( () => {
  if(data.value && data.value.length)
  return data.value.map( player => ( {
    id: player.id,
    name: player.name,
    email: player.email || '',
    avatar: { src: player.image, alt: player.name },
    status: player.banned ? 'banned' : 'active',//.status.toLowerCase() as 'active' | 'inactive' | 'banned',
    location: '', // This field is being replaced with lastLoginAt
    lastLoginAt: player.createdAt,
    username: player.name,
    avatarUrl: player.name
  } ) );
} );

/**
 * Check if players data is currently loading.
 */
// const isLoading = computed( () => dashboardStore.isLoadingPlayers );

/**
 * Check if there's an error loading players data.
 */
// const hasError = computed( () => Boolean( dashboardStore.playersError ) );

/**
 * Generate action menu items for each player row.
 * Provides context-specific actions for player management.
 */
function getRowItems( row: Row<any> ) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      label: 'Copy player ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText( row.original.id );
        toast.add( {
          title: 'Copied to clipboard',
          description: 'Player ID copied to clipboard'
        } );
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'View player details',
      icon: 'i-lucide-list'
    },
    {
      label: 'View player transactions',
      icon: 'i-lucide-wallet'
    },
    {
      type: 'separator'
    },
    {
      label: 'Delete player',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() {
        toast.add( {
          title: 'Player deleted',
          description: 'The player has been deleted.'
        } );
      }
    }
  ];
}

const columns: TableColumn<User>[] = [
  {
    id: 'select',
    header: ( { table } ) =>
      h( UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': ( value: boolean | 'indeterminate' ) =>
          table.toggleAllPageRowsSelected( !!value ),
        'ariaLabel': 'Select all'
      } ),
    cell: ( { row } ) =>
      h( UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': ( value: boolean | 'indeterminate' ) => row.toggleSelected( !!value ),
        'ariaLabel': 'Select row'
      } )
  },
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ( { row } ) => {
      return h( 'div', { class: 'flex items-center gap-3' }, [
        h( UAvatar, {
          ...row.original.avatar,
          size: 'lg'
        } ),
        h( 'div', undefined, [
          h( 'p', { class: 'font-medium text-highlighted' }, row.original.name ),
          h( 'p', { class: '' }, `@${ row.original.name }` )
        ] )
      ] );
    }
  },
  {
    accessorKey: 'email',
    header: ( { column } ) => {
      const isSorted = column.getIsSorted();

      return h( UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Email',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting( column.getIsSorted() === 'asc' )
      } );
    }
  },
  {
    accessorKey: 'lastLoginAt',
    header: 'Last Login',
    cell: ( { row } ) => {
      const lastLogin = row.original.lastLoginAt;
      if ( !lastLogin ) return h( 'span', { class: 'text-muted' }, 'Never' );

      const date = new Date( lastLogin );
      const formatted = date.toLocaleDateString( 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      } );

      return h( 'span', { class: 'text-sm' }, formatted );
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: 'equals',
    cell: ( { row } ) => {
      const status = row.original.status;
      const color = {
        active: 'success' as const,
        inactive: 'warning' as const,
        banned: 'error' as const
      }[ status ] || 'neutral';

      return h( UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
        status
      );
    }
  },
  {
    id: 'actions',
    cell: ( { row } ) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowItems( row )
          },
          () =>
            h( UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            } )
        )
      );
    }
  }
];

/**
 * Status filter for players (updated to match API status values).
 */
const statusFilter = ref( 'all' );

/**
 * Watch for status filter changes and update the table filter.
 */
watch( () => statusFilter.value, ( newVal ) => {
  if ( !table?.value?.tableApi ) return;

  const statusColumn = table.value.tableApi.getColumn( 'status' );
  if ( !statusColumn ) return;

  if ( newVal === 'all' ) {
    statusColumn.setFilterValue( undefined );
  } else {
    statusColumn.setFilterValue( newVal );
  }
} );


/**
 * Initialize the component by fetching players data.
 */
onMounted( async () => {
  await dashboardStore.fetchPlayers();
} );
</script>

<template>
  <UDashboardPanel id="customers">
    <template #header>
      <UDashboardNavbar title="Customers">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <CustomersAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <!-- <UInput
          :model-value=" ( table?.tableApi?.getColumn( 'email' )?.getFilterValue() as string ) "
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filter emails..."
          @update:model-value="table?.tableApi?.getColumn( 'email' )?.setFilterValue( $event )"
        /> -->  
        <UInput v-model="search" class="max-w-sm" placeholder="Filter..." />

        <div class="flex flex-wrap items-center gap-1.5">
          <CustomersDeleteModal :count=" table?.tableApi?.getFilteredSelectedRowModel().rows.length ">
            <UButton
              v-if=" table?.tableApi?.getFilteredSelectedRowModel().rows.length "
              label="Delete"
              color="error"
              variant="subtle"
              icon="i-lucide-trash"
            >
              <template #trailing>
                <UKbd>
                  {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                </UKbd>
              </template>
            </UButton>
          </CustomersDeleteModal>

          <USelect
            v-model=" statusFilter "
            :items=" [
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Banned', value: 'banned' }
            ] "
            :ui=" { trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' } "
            placeholder="Filter status"
            class="min-w-28"
          />
          <UDropdownMenu
            :items=" table?.tableApi
              ?.getAllColumns()
              .filter( ( column: any ) => column.getCanHide() )
              .map( ( column: any ) => ( {
                label: upperFirst( column.id ),
                type: 'checkbox' as const,
                checked: column.getIsVisible(),
                onUpdateChecked( checked: boolean ) {
                  table?.tableApi?.getColumn( column.id )?.toggleVisibility( !!checked )
                },
                onSelect( e?: Event ) {
                  e?.preventDefault()
                }
              } ) )
            "
            :content=" { align: 'end' } "
          >
            <UButton
              label="Display"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Loading State -->
      <div
        v-if=" isPending "
        class="space-y-4"
      >
        <div
          v-for=" i in 5 "
          :key=" `loading-${ i }` "
          class="flex items-center gap-4 p-4"
        >
          <USkeleton class="h-10 w-10 rounded-full" />
          <div class="flex-1 space-y-2">
            <USkeleton class="h-4 w-32" />
            <USkeleton class="h-3 w-48" />
          </div>
          <USkeleton class="h-6 w-16" />
          <USkeleton class="h-4 w-20" />
        </div>
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if=" error "
        icon="i-lucide-alert-circle"
        color="error"
        variant="soft"
        title="Error Loading Players"
        :description=" dashboardStore.playersError || 'Failed to load players data' "
        class="mb-6"
      />

      <!-- Players Table -->
      <UTable
        v-else
        ref="table"
        v-model:column-filters=" columnFilters "
        v-model:column-visibility=" columnVisibility "
        v-model:row-selection=" rowSelection "
        v-model:pagination=" pagination "
        :pagination-options=" {
          getPaginationRowModel: getPaginationRowModel()
        } "
        class="shrink-0"
        :data=" mappedPlayers "
        :columns=" columns "
        :loading=" isPending "
        :ui=" {
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default'
        } "
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page=" ( table?.tableApi?.getState().pagination.pageIndex || 0 ) + 1 "
            :items-per-page=" table?.tableApi?.getState().pagination.pageSize "
            :total=" table?.tableApi?.getFilteredRowModel().rows.length "
            @update:page=" ( p: number ) => table?.tableApi?.setPageIndex( p - 1 ) "
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
